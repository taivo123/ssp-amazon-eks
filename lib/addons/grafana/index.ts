import * as cdk from '@aws-cdk/core';

import { ClusterAddOn, ClusterInfo } from "../../stacks/eks-blueprint-stack";

const DEFAULT_CHART_VERSION = '6.9.1'
const CHART_REPO = 'https://grafana.github.io/helm-charts'
const DEFAULT_ADMIN_SECRET_KEY = 'ADMIN_SECRET_KEY'

/**
 * Properties for the GrafanaAddOn
 */
type GrafanaAddOnProps = {
    /**
     * The version of the Grafana Helm chart to deploy. 
     * @default DEFAULT_CHART_VERSION
     */
    version: string

    /**
     * The key under which the admin password is stored in AWS secrets manager.
     */
    adminsSecretKey: string
}

/**
 * GrafanaAddOn installs Grafana in an EKS cluster.
 */

export class GrafanaAddOn implements ClusterAddOn {

    readonly version: string

    readonly adminsSecretKey: string

    constructor(props?: GrafanaAddOnProps) {
        this.version = props?.version ?? DEFAULT_CHART_VERSION
        this.adminsSecretKey = props?.adminsSecretKey ?? DEFAULT_ADMIN_SECRET_KEY
    }

    deploy(clusterInfo: ClusterInfo): void {
        const adminPassword = cdk.SecretValue.secretsManager(this.adminsSecretKey)
        clusterInfo.cluster.addHelmChart("grafana-addon", {
            chart: "grafana",
            repository: CHART_REPO,
            version: this.version,
            namespace: "grafana",
            values: {
                adminUser: 'admin',
                adminPassword: adminPassword
            }
        });
    }

    bootstrap(clusterInfo: ClusterInfo): void {
        const prometheusURL = ''
        clusterInfo.cluster.addManifest("grafana-addon", {
            values: {
                datasources: {
                    'datasources.yaml': {
                        apiVersion: 1,
                        datasources: [{
                            name: "Prometheus",
                            type: "prometheus",
                            url: prometheusURL,
                            access: "proxy",
                            isDefault: true
                        }]
                    }
                }
            }
        })
    }
}