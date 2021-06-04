import { ClusterAddOn, ClusterInfo } from "../../stacks/eks-blueprint-stack";

export class Grafana implements ClusterAddOn {

    deploy(clusterInfo: ClusterInfo): void {
        clusterInfo.cluster.addHelmChart("grafana-addon", {
            chart: "grafana",
            repository: "https://grafana.github.io/helm-charts",
            version: '6.9.1',
            namespace: "grafana",
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