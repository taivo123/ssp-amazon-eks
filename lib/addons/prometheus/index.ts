import { ClusterAddOn, ClusterInfo } from "../../stacks/eks-blueprint-stack";

const DEFAULT_CHART_VERSION = '14.4.0'
const CHART_REPO = 'https://prometheus-community.github.io/helm-charts'

/**
 * Properties for the PrometheusAddOn
 */
type PrometheusAddOnProps = {
    /**
     * The version of the Prometheus Helm chart to deploy. 
     * @default DEFAULT_CHART_VERSION
     */
    version: string


    values?: { [map: string]: any }
}

/**
 * PrometheusAddOn installs Prometheus in an EKS cluster.
 */
export class PrometheusAddOn implements ClusterAddOn {

    private version: string;

    private values?: { [map: string]: any }

    constructor(props?: PrometheusAddOnProps) {
        this.version = props?.version ?? DEFAULT_CHART_VERSION;
        this.values = props?.values
    }

    deploy(clusterInfo: ClusterInfo): void {
        clusterInfo.cluster.addHelmChart("prometheus-addon", {
            chart: "prometheus",
            repository: CHART_REPO,
            version: this.version,
            namespace: "prometheus",
            values: this.values
        });
    }
}