import * as cdk from '@aws-cdk/core';

// SSP Lib
import * as ssp from '../../lib'

// Team implementations
import * as team from '../teams'

export default class MultiTeamStack {
    constructor(app: cdk.App, id: string, props?: cdk.StackProps) {

        // Teams for the cluster.
        const teams: Array<ssp.Team> = [
            new team.TeamPlatform,
            new team.TeamTroiSetup,
            new team.TeamRikerSetup,
            new team.TeamBurnhamSetup(app)
        ];

        // AddOns for the cluster.
        const addOns: Array<ssp.ClusterAddOn> = [
            new ssp.NginxAddon,
            new ssp.ArgoCDAddon,
            new ssp.CalicoAddon,
            new ssp.MetricsServerAddon,
            new ssp.ClusterAutoScalerAddon,
            new ssp.ContainerInsightsAddOn,
        ];

        new ssp.EksBlueprint(app, { id, addOns, teams }, {
            env: {
                region: 'us-east-2',
            },
        });
    }
}


