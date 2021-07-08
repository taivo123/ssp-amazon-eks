import { ClusterAddOn, ClusterInfo } from "../../stacks/eks-blueprint-stack";

const DEFAULT_CHART_VERSION = '14.4.0'
const CHART_REPO = 'https://prometheus-community.github.io/helm-charts'

/**
 * PrometheusAddOn installs Prometheus in an EKS cluster.
 */
export class PrometheusAddOn implements ClusterAddOn {
    private version: string;

    constructor(version?: string) {
        this.version = version ?? DEFAULT_CHART_VERSION;
    }

    deploy(clusterInfo: ClusterInfo): void {
        clusterInfo.cluster.addHelmChart("prometheus-addon", {
            chart: "prometheus",
            repository: CHART_REPO,
            version: this.version,
            namespace: "prometheus",
        });
    }
}