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
import { createNamespace } from "../../utils/namespace";

/**
 * Configuration options for the FluentBit add-on.
 */
export interface FluentBitAddOnProps {
    /**
     * @default `logging`
     */
    readonly namespace?: string;

    /**
     * The ARN for the Elasticsearch domain.
     */
    readonly domainArn: string

    /**
     * The endpoint for the Elasticsearch domain.
     */
    readonly domainEndpoint: string

    /**
     * Admin username for the Elasticsearch domain.
     */
    readonly adminUsername: string

    /**
     * Secret key for the password in SecretsManage for the domain.
     */
    readonly adminPasswordSecretKey: string
}

export class FluentBitAddOn implements ClusterAddOn {

    readonly namespace = 'logging'

    private fluentBitSARoleArn: string

    constructor(private readonly options?: FluentBitAddOnProps) { }

    deploy(clusterInfo: ClusterInfo): void {
        /**
         * Deploy Fluent Bit
         */
        this.deployFluentBit(clusterInfo)
    }

    postDeploy(clusterInfo: ClusterInfo, teams: Team[]): void {
        /**
         * Maps the FluentBit IAM Role to the Admin User.   
         * https://www.eksworkshop.com/intermediate/230_logging/config_es/
         */
        this.mapIAMRoleToUser()
    }

    protected deployFluentBit(clusterInfo: ClusterInfo) {
        /**
         * Create the FluentBit namespace.
         */
        const cluster = clusterInfo.cluster;
        const namespace = this.options?.namespace ?? this.namespace
        const namespaceManifest = createNamespace(cluster, namespace)

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
        const domainArn = this.options?.domainArn!
        const policy = new PolicyStatement({
            effect: Effect.ALLOW,
            actions: ['es:ESHttp*'],
            resources: [domainArn]
        })
        sa.addToPrincipalPolicy(policy);
        this.fluentBitSARoleArn = sa.role.roleArn

        /**
         * Apply the FluentBit manifest.
         * Source: https://www.eksworkshop.com/intermediate/230_logging/deploy/
         */
        const domainEndpoint = this.options?.domainEndpoint!
        const doc = readYamlDocument(__dirname + '/fluent-bit.yaml');
        const docArray = doc.replace(/{{es_endpoint}}/g, domainEndpoint)
            .replace(/{{fluent-bit-service-account}}/g, serviceAccountName)
        const manifest = docArray.split("---").map(e => loadYaml(e));
        new KubernetesManifest(cluster.stack, "fluent-bit-daemon", {
            cluster,
            manifest,
            overwrite: true
        });
    }

    protected mapIAMRoleToUser() {
        const masterUserName = this.options?.adminUsername!
        const adminPasswordSecretKey = this.options?.adminPasswordSecretKey!
        const masterUserPassword = cdk.SecretValue.secretsManager(adminPasswordSecretKey)
        const auth = Buffer.from(`${masterUserName}:${masterUserPassword}`)

        const domainEndpoint = this.options?.domainEndpoint
        const url = `https://${domainEndpoint}/_opendistro/_security/api/rolesmapping/all_access?pretty`
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
}
