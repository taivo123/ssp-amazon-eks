#!/usr/bin/env node
import * as cdk from '@aws-cdk/core';

const app = new cdk.App();

//-------------------------------------------
// Single Cluster with multiple teams.
//-------------------------------------------

import MultiTeamStack from '../examples/multi-team-stack'
new MultiTeamStack(app, 'MultiTeamStack', {});


//-------------------------------------------
// Multiple clusters, multiple regions.
//-------------------------------------------

import MultiRegionStack from '../examples/multi-region-stack'
new MultiRegionStack(app, 'MultiRegionStack', {});


//-------------------------------------------
// Single Fargate cluster.
//-------------------------------------------

import FargateStack from '../examples/fargate-stack'
new FargateStack(app, 'FargateStack', {});


//-------------------------------------------
// Multiple clusters with deployment pipeline.
//-------------------------------------------

import PipelineStack from '../examples/pipeline-stack'
const env = { account: "929819487611", region: 'us-east-1' }
new PipelineStack(app, 'PipelineStack', { env });


//-------------------------------------------
// Single cluster with Bottlerocket nodes.
//-------------------------------------------

import BottleRocketStack from '../examples/bottlerocket-stack'
new BottleRocketStack(app, 'BottleRocketStack', {});


//-------------------------------------------
// Single cluster with custom configuration.
//-------------------------------------------

import CustomClusterStack from '../examples/custom-cluster-stack'
new CustomClusterStack(app, 'CustomClusterStack', {});



