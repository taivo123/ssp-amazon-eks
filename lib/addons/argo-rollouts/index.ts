import { ClusterAddOn, ClusterInfo } from "../../spi";
import { loadExternalYaml } from "../../utils/yaml-utils";

/**
 * Configuration options for the add-on.
 */
export interface ArgoRolloutsAddOnProps {
    /**
     * Argo Rollouts version
     * @default v1.0.6
     */
    version?: string;
}

/**
 * Defaults options for the add-on
 */
const defaultProps: ArgoRolloutsAddOnProps = {
    version: "v1.0.6"
};

export class ArgoRolloutsAddOn implements ClusterAddOn {

    private options: ArgoRolloutsAddOnProps;

    constructor(props?: ArgoRolloutsAddOnProps) {
        this.options = { ...defaultProps, ...props };
    }


//kubectl create namespace argo-rollouts
//kubectl apply -n argo-rollouts -f https://github.com/argoproj/argo-rollouts/releases/latest/download/install.yaml

    deploy(clusterInfo: ClusterInfo): void {
        const version = this.options.version;
        const manifestUrl = `https://github.com/argoproj/argo-rollouts/releases/latest/download/install.yaml`;
        const manifest = loadExternalYaml(manifestUrl);
        clusterInfo.cluster.addManifest('argo-rollouts', ...manifest);
    }
}