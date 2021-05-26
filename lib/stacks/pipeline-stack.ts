import { Construct, SecretValue, Stack, StackProps, Stage, StageProps } from "@aws-cdk/core";
import { EksBlueprint } from "./eks-blueprint-stack";
import { CdkPipeline, SimpleSynthAction } from '@aws-cdk/pipelines';
import * as codepipeline from '@aws-cdk/aws-codepipeline';
import * as actions from '@aws-cdk/aws-codepipeline-actions';

export class FactoryApplication extends Stage {
    constructor(scope: Construct, id: string, props?: StageProps) {
        super(scope, id, props);
        new EksBlueprint(this, { id: 'eks' });
    }
}

export class PipelineStack extends Stack {
    constructor(scope: Construct, id: string, props?: StackProps) {
        super(scope, id, props);


    }
}