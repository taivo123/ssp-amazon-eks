import * as cdk from '@aws-cdk/core';

// SSP Lib
import * as ssp from '../../lib'

// Team implementations
import * as team from '../teams'

export default class BottlerocketStack {
    constructor(app: cdk.App, id: string, props?: cdk.StackProps) {

        // Teams for the cluster.
        const teams: Array<ssp.Team> = [
            new team.TeamPlatform,
        ];

        // AddOns for the cluster.
        const addOns: Array<ssp.ClusterAddOn> = [
            new ssp.NginxAddon,
            new ssp.ArgoCDAddon,
            new ssp.CalicoAddon,
            new ssp.MetricsServerAddon,
            new ssp.ContainerInsightsAddOn,
        ];

        const clusterProvider = new ssp.BottlerocketClusterProvider()
        new ssp.EksBlueprint(app, { id, teams, addOns, clusterProvider }, {
            env: {
                region: 'us-east-1'
            }
        })
    }
}


