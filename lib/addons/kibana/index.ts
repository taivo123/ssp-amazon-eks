import { ClusterAddOn, ClusterInfo } from "../../stacks/eks-blueprint-stack";

export class Grafana implements ClusterAddOn {

    deploy(clusterInfo: ClusterInfo): void {
        clusterInfo.cluster.addHelmChart("kibana-addon", {
            chart: "kibana",
            repository: "https://helm.elastic.co",
            version: '7.12.1',
            namespace: "kibana",
            values: {
                adminUser: 'admin',
                adminPassword: "admin",
                datasources: {
                    'datasources.yaml': {
                        apiVersion: 1,
                        datasources: [{
                            name: "Prometheus",
                            type: "prometheus",
                            url: "http://prometheus-server.prometheus.svc.cluster.local", // Todo - need to dyanmically get this. 
                            access: "proxy",
                            isDefault: true
                        }]
                    }
                }
            }
        });
    }
}