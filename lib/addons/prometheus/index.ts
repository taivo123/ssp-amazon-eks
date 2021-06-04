import { ClusterAddOn, ClusterInfo } from "../../stacks/eks-blueprint-stack";

export class Prometheus implements ClusterAddOn {

    deploy(clusterInfo: ClusterInfo): void {
        clusterInfo.cluster.addHelmChart("prometheus-addon", {
            chart: "prometheus",
            repository: "https://prometheus-community.github.io/helm-charts",
            version: '13.8.0',
            namespace: "prometheus",
        });
    }
}