import * as cdk from '@aws-cdk/core';
import * as ec2 from '@aws-cdk/aws-ec2';
import * as eks from '@aws-cdk/aws-eks';
// SSP Lib
import * as ssp from '../../lib'

// Team implementations
import * as team from '../teams'

export default class CustomClusterStack {
    constructor(app: cdk.App, id: string, props?: cdk.StackProps) {
        // Teams for the cluster.
        const teams: Array<ssp.Team> = [
            new team.TeamPlatform,
        ];

        // AddOns for the cluster.
        const addOns: Array<ssp.ClusterAddOn> = [
            new ssp.NginxAddOn,
            new ssp.ArgoCDAddOn,
            new ssp.CalicoAddOn,
            new ssp.MetricsServerAddOn,
            new ssp.ContainerInsightsAddOn,
        ];

        const clusterProps: ssp.EC2ProviderClusterProps = {
            version: eks.KubernetesVersion.V1_19,
            instanceTypes: [new ec2.InstanceType('t3.large')],
            amiType: eks.NodegroupAmiType.AL2_X86_64
        }

        const clusterProvider = new ssp.EC2ClusterProvider(clusterProps);
        new ssp.EksBlueprint(app, { id, teams, addOns, clusterProvider });
    }
}


