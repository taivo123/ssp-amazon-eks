#!/usr/bin/env node
import * as cdk from '@aws-cdk/core';

const app = new cdk.App();

//-------------------------------------------
// Single Cluster with multiple teams.
//-------------------------------------------

import MultiTeamStack from '../examples/multi-team-stack'
new MultiTeamStack(app, 'multi-team-stack', {});


//-------------------------------------------
// Multiple clusters, multiple regions.
//-------------------------------------------

import MultiRegionStack from '../examples/multi-region-stack'
new MultiRegionStack(app, 'multi-region-stack', {});


//-------------------------------------------
// Single Fargate cluster.
//-------------------------------------------

import FargateStack from '../examples/fargate-stack'
new FargateStack(app, 'fargate-stack', {});


//-------------------------------------------
// Multiple clusters with deployment pipeline.
//-------------------------------------------

import PipelineStack from '../examples/pipeline-stack'
const env = { account: "115717706081", region: 'us-east-1' }
new PipelineStack(app, 'pipeline-stack', { env });


//-------------------------------------------
// Single cluster with Bottlerocket nodes.
//-------------------------------------------

import BottleRocketStack from '../examples/bottlerocket-stack'
new BottleRocketStack(app, 'bottlerocket-stack', {});


//-------------------------------------------
// Single cluster with custom configuration.
//-------------------------------------------

import CustomClusterStack from '../examples/custom-cluster-stack'
new CustomClusterStack(app, 'custom-cluster-stack', {});



