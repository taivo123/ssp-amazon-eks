import * as cdk from '@aws-cdk/core';

// SSP Lib
import * as ssp from '../../lib'

// Team implementations
import * as team from '../teams'

export default class MultiRegionStack {
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
            new ssp.ClusterAutoScalerAddOn,
            new ssp.ContainerInsightsAddOn,
        ];

        const east = 'us-east-2'
        new ssp.EksBlueprint(app, { id: `${id}-${east}`, addOns, teams }, {
            env: { region: east }
        });

        const central = 'us-central-2'
        new ssp.EksBlueprint(app, { id: `${id}-${central}`, addOns, teams }, {
            env: { region: central }
        });

        const west = 'us-west-2'
        new ssp.EksBlueprint(app, { id: `${id}-${west}`, addOns, teams }, {
            env: { region: west }
        });
    }
}
