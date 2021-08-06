import * as cdk from '@aws-cdk/core';
import { Construct } from '@aws-cdk/core';
import * as es from '@aws-cdk/aws-elasticsearch';
import * as iam from '@aws-cdk/aws-iam';
import { KubernetesManifest } from '@aws-cdk/aws-eks';
import { Effect, PolicyStatement } from '@aws-cdk/aws-iam';

import { ClusterAddOn, ClusterInfo } from "../../stacks/cluster-types";
import { loadYaml, readYamlDocument } from "../../utils/yaml-utils";

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

    readonly namespace = 'elasticsearch'

    readonly adminUsername = 'admin'

    readonly adminPasswordSecretKey = 'elastic-search-password'

    readonly version = es.ElasticsearchVersion.V7_10

    constructor(private readonly options?: ElasticsearchAddOnProps) { }

    deploy(clusterInfo: ClusterInfo): void {
        /**
         * Provision a new Elasticsearch domain.
         */
        const domain = this.provisionElasticsearchDomain(clusterInfo)

        /**
         * Deploy Fluent Bit
         */
        this.deployFluentBit(clusterInfo, domain.domainEndpoint)
    }

    protected provisionElasticsearchDomain(clusterInfo: ClusterInfo) {
        const cluster = clusterInfo.cluster;
        const domainName = this.options?.domainName ?? this.domainName;

        const namespace = 'logging'
        const namespaceManifest = this.createNamespace(clusterInfo, namespace)
        const serviceAccountName = 'fluent-bit-service-account'
        const sa = cluster.addServiceAccount(serviceAccountName, {
            name: serviceAccountName,
            namespace: namespace
        });
        sa.node.addDependency(namespaceManifest);

        const region = cluster.stack.region
        const accountID = cluster.stack.account
        const domainArn = `arn:aws:es:${region}:${accountID}:domain/${domainName}}`
        const policy = new PolicyStatement({
            effect: Effect.ALLOW,
            actions: ['es:ESHttp*'],
            resources: [domainArn]
        })
        sa.addToPrincipalPolicy(policy);

        /**
         * Setup Elastic Search
         */
        const domainPolicy = new PolicyStatement({
            effect: Effect.ALLOW,
            actions: ['es:ESHttp*'],
            principals: [new iam.AnyPrincipal()],
            resources: [domainArn]
        })

        const masterUserName = this.options?.adminUsername || this.adminUsername
        const adminPasswordSecretKey = this.options?.adminPasswordSecretKey || this.adminPasswordSecretKey
        const masterUserPassword = cdk.SecretValue.secretsManager(adminPasswordSecretKey)
        return new es.Domain(clusterInfo.cluster.stack, domainName, {
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
    }
    protected deployFluentBit(clusterInfo: ClusterInfo, domainEndpoint: string) {
        const cluster = clusterInfo.cluster;
        const domainName = this.options?.domainName ?? this.domainName;

        // Apply manifest
        const doc = readYamlDocument(__dirname + '/fluent-bit.yaml');
        const docArray = doc.replace(/{{es_endpoint}}/g, domainEndpoint)
        const manifest = docArray.split("---").map(e => loadYaml(e));
        new KubernetesManifest(cluster.stack, "fluent-bit-daemon", {
            cluster,
            manifest,
            overwrite: true
        });
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
