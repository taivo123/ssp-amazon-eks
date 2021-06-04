import * as cdk from '@aws-cdk/core';
import * as eks from '@aws-cdk/aws-eks';
// SSP Lib
import * as ssp from '../../lib'

// Team implementations
import * as team from '../teams'

export default class FargateStack {
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
        ];

        // TODO - what is with dynatrace?
        const fargateProfiles: Map<string, eks.FargateProfileOptions> = new Map([
            ["dynatrace", { selectors: [{ namespace: "dynatrace" }] }]
        ]);

        const clusterProvider = new ssp.FargateClusterProvider(fargateProfiles)
        new ssp.EksBlueprint(app, { id, teams, addOns, clusterProvider }, {
            env: {
                region: 'us-east-1'
            }
        })
    }
}


