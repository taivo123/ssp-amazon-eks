import { Construct } from '@aws-cdk/core';
import { ClusterAddOn, ClusterInfo } from '../../spi';
import { HelmAddOnUserProps } from '../helm-addon';
import { CsiDriverProviderAws } from './csi-driver-provider-aws';

/**
 * Configuration options for Secrets Store AddOn
 */
export interface SecretsStoreAddOnProps extends HelmAddOnUserProps {
    /**
     * Namespace where Secrets Store CSI driver will be installed
     * @default 'kube-system'
     */
    readonly namespace?: string;

    /**
     * Version of the Secrets Store CSI Driver. Eg. v0.0.23
     * @default 'v0.0.23/'
     */
    readonly version?: string;

    /**
     * Rotation Poll Interval, e.g. '120s'.
     * @default undefined
     * If provided, sets auto rotation to true and sets the polling interval.
     */
    readonly rotationPollInterval?: string;

    /**
     * Enable Sync Secrets to kubernetes secrets
     */
    readonly syncSecrets?: boolean;

    /**
     * ASCP secret and configuration provider URL for provisioning.
     */
    readonly ascpUrl?: string
}

/**
 * Defaults options for the add-on
 */
const defaultProps: SecretsStoreAddOnProps = {
    ascpUrl: 'https://raw.githubusercontent.com/aws/secrets-store-csi-driver-provider-aws/main/deployment/aws-provider-installer.yaml',
    chart: 'secrets-store-csi-driver',
    name: 'secrets-store-csi-driver',
    namespace: 'kube-system',
    version: 'v0.0.23',
    release: 'ssp-addon-secret-store-csi-driver',
    repository: 'https://raw.githubusercontent.com/kubernetes-sigs/secrets-store-csi-driver/master/charts',
    rotationPollInterval: undefined,
    syncSecrets: true,
}

export class SecretsStoreAddOn implements ClusterAddOn {

    private options: SecretsStoreAddOnProps;

    constructor(props?: SecretsStoreAddOnProps) {
        this.options = { ...defaultProps, ...props };
    }

    deploy(clusterInfo: ClusterInfo): Promise<Construct> {
        const csiDriverProviderAws = new CsiDriverProviderAws(this.options);
        return Promise.resolve(csiDriverProviderAws.deploy(clusterInfo));
    }
}
