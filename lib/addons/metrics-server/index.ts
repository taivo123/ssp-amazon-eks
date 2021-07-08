import { ClusterAddOn, ClusterInfo } from "../../stacks/eks-blueprint-stack";
import { loadExternalYaml } from "../../utils/yaml-utils";

/**
 * MetricsServerAddOn installs the Kubernetes Metrics Server into an EKS Cluster.
 * 
 * See https://github.com/kubernetes-sigs/metrics-server for details on Kubernetes Metrics Server
 */
export class MetricsServerAddOn implements ClusterAddOn {

    private version: string;

    constructor(version?: string) {
        this.version = version ?? "v0.4.1";
    }

    deploy(clusterInfo: ClusterInfo): void {
        const manifestUrl = `https://github.com/kubernetes-sigs/metrics-server/releases/download/${this.version}/components.yaml`;
        const manifest = loadExternalYaml(manifestUrl);
        clusterInfo.cluster.addManifest('metrics-server-addon', ...manifest);
    }
}