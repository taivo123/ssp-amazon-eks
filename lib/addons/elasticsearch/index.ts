import * as cdk from '@aws-cdk/core';
import { Construct } from '@aws-cdk/core';
import * as es from '@aws-cdk/aws-elasticsearch';
import * as iam from '@aws-cdk/aws-iam';
import { KubernetesManifest } from '@aws-cdk/aws-eks';
import { Effect, PolicyStatement } from '@aws-cdk/aws-iam';
import request from 'sync-request';

import { ClusterAddOn, ClusterInfo } from "../../stacks/cluster-types";
import { loadYaml, readYamlDocument } from "../../utils/yaml-utils";
import { Team } from "../../teams";

/**
 * Configuration options for the external DNS add-on.
 */
export interface ElasticsearchAddOnProps {
    /**
     * The domain name for the ES instance.
     * @default `blueprint-elasticsearch-domain`
     */
    readonly domainName?: string

    /**
     * The username for the admin.
     * @default `admin`
     */
    readonly adminUsername?: string

    /**
     * Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character
     */
    readonly adminPasswordSecretKey?: string

    /**
     * @default `elasticsearch`
     */
    readonly namespace?: string;

    /**
     * @default `es.ElasticsearchVersion.V7_1`
     */
    readonly version?: string;

    readonly scope: Construct
}


export class ElasticsearchAddOn implements ClusterAddOn {

    readonly domainName = 'elasticsearch-logging';

    readonly namespace = 'logging'

    readonly adminUsername = 'admin'

    readonly adminPasswordSecretKey = 'elastic-search-password'

    readonly version = es.ElasticsearchVersion.V7_10

    private fluentBitSARoleArn: string

    private elasticSearchDomainEndpoint: string

    constructor(private readonly options?: ElasticsearchAddOnProps) { }

    deploy(clusterInfo: ClusterInfo): void {
        /**
         * Provision a new Elasticsearch domain.
         */
        const domain = this.provisionElasticsearchDomain(clusterInfo)

        /**
         * Deploy Fluent Bit
         */
        this.deployFluentBit(clusterInfo, domain)
    }

    postDeploy(clusterInfo: ClusterInfo, teams: Team[]): void {
        /**
         * Maps the FluentBit IAM Role to the Admin User.   
         * https://www.eksworkshop.com/intermediate/230_logging/config_es/
         */
        this.mapIAMRoleToUser()
    }

    protected provisionElasticsearchDomain(clusterInfo: ClusterInfo) {
        /**
         * Build our domain Arn.
         */
        const cluster = clusterInfo.cluster;
        const region = cluster.stack.region
        const accountID = cluster.stack.account
        const domainName = this.options?.domainName ?? this.domainName;
        const domainArn = `arn:aws:es:${region}:${accountID}:domain/${domainName}`

        /**
         * Configure IAM policy for the domain.
         */
        const domainPolicy = new PolicyStatement({
            effect: Effect.ALLOW,
            actions: ['es:ESHttp*'],
            principals: [new iam.AnyPrincipal()],
            resources: [`${domainArn}/*`]
        })

        /**
         * Deploy the Elasicsearch domain.
         */
        const masterUserName = this.options?.adminUsername || this.adminUsername
        const adminPasswordSecretKey = this.options?.adminPasswordSecretKey || this.adminPasswordSecretKey
        const masterUserPassword = cdk.SecretValue.secretsManager(adminPasswordSecretKey)
        const domain = new es.Domain(clusterInfo.cluster.stack, domainName, {
            domainName,
            version: this.version,
            capacity: {
                masterNodes: 5,
                dataNodes: 20
            },
            ebs: {
                volumeSize: 20
            },
            zoneAwareness: {
                availabilityZoneCount: 3
            },
            logging: {
                slowSearchLogEnabled: true,
                appLogEnabled: true,
                slowIndexLogEnabled: true,
            },
            accessPolicies: [domainPolicy],
            fineGrainedAccessControl: {
                masterUserName,
                masterUserPassword
            },
            nodeToNodeEncryption: true,
            encryptionAtRest: {
                enabled: true
            },
            enforceHttps: true,
            removalPolicy: cdk.RemovalPolicy.DESTROY
        });
        this.elasticSearchDomainEndpoint = domain.domainEndpoint
        return domain
    }

    protected deployFluentBit(clusterInfo: ClusterInfo, domain: es.Domain) {
        /**
         * Create the FluentBit namespace.
         */
        const cluster = clusterInfo.cluster;
        const namespace = this.options?.namespace ?? this.namespace
        const namespaceManifest = this.createNamespace(clusterInfo, namespace)

        /**
         * Create the FluentBut service account.
         */
        const serviceAccountName = 'fluent-bit-service-account'
        const sa = cluster.addServiceAccount(serviceAccountName, {
            name: serviceAccountName,
            namespace: namespace
        });
        sa.node.addDependency(namespaceManifest)


        /**
         * Create the IAM Policy for the service account 
         * Allows the SA to make requests to the Elasticsearch domain. 
         */
        const policy = new PolicyStatement({
            effect: Effect.ALLOW,
            actions: ['es:ESHttp*'],
            resources: [domain.domainArn]
        })
        sa.addToPrincipalPolicy(policy);
        this.fluentBitSARoleArn = sa.role.roleArn

        /**
         * Apply the FluentBit manifest.
         * Source: https://www.eksworkshop.com/intermediate/230_logging/deploy/
         */
        const doc = readYamlDocument(__dirname + '/fluent-bit.yaml');
        const docArray = doc.replace(/{{es_endpoint}}/g, domain.domainEndpoint)
            .replace(/{{fluent-bit-service-account}}/g, serviceAccountName)
        const manifest = docArray.split("---").map(e => loadYaml(e));
        new KubernetesManifest(cluster.stack, "fluent-bit-daemon", {
            cluster,
            manifest,
            overwrite: true
        });
    }

    protected mapIAMRoleToUser() {
        const masterUserName = this.options?.adminUsername || this.adminUsername
        const adminPasswordSecretKey = this.options?.adminPasswordSecretKey || this.adminPasswordSecretKey
        const masterUserPassword = cdk.SecretValue.secretsManager(adminPasswordSecretKey)
        const auth = Buffer.from(`${masterUserName}:${masterUserPassword}`).toString("base64")
        const url = `https://${this.elasticSearchDomainEndpoint}/_opendistro/_security/api/rolesmapping/all_access?pretty`
        const opts = {
            headers: {
                'Content Type': 'application/json',
                'Authorization': "Basic " + auth
            },
            json: {
                "op": "add",
                "path": "/backend_roles",
                "value": [`"'${this.fluentBitSARoleArn}'"`]
            },
        }
        console.log("ES URL", url)
        console.log("ES OPTS", opts)
        request('PATCH', url, opts)
    }

    /**
     * Creates namespace, which is a prerequisite for service account creation and subsequent chart execution.
     * @param clusterInfo 
     * @returns 
    */
    protected createNamespace(clusterInfo: ClusterInfo, namespace: string): KubernetesManifest {
        const stack = clusterInfo.cluster.stack
        const id = 'elastic-search-manifest'
        return new KubernetesManifest(stack, id, {
            cluster: clusterInfo.cluster,
            manifest: [{
                apiVersion: 'v1',
                kind: 'Namespace',
                metadata: {
                    name: namespace,
                }
            }],
            overwrite: true,
            prune: true
        });
    }

}
