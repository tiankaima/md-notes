# 监控

> 记录当前监控部署与配置。

!!! warning "当前 node-exporter, dcgm-exporter, prometheus 直接使用 `network: host` 模式"

```bash title="On target slave"
sudo mkdir -p /srv/docker/monitor/proetheus/config/
sudo mkdir -p /srv/docker/monitor/proetheus/data/
sudo vim /srv/docker/monitor/proetheus/config/proetheus.yml
```

=== "jp-2"

    === "docker-compose.yml"

        ```yaml title="/srv/docker/monitor/docker-compose.yml"
        services:
          node-exporter:
            image: prom/node-exporter:latest
            container_name: monitor-node-exporter
            restart: always
            network_mode: host
            pid: "host"
            volumes:
              - "/:/host:ro,rslave"
            command:
              - "--path.rootfs=/host"
          
          blackbox-exporter:
            image: prom/blackbox-exporter:latest
            container_name: monitor-blackbox-exporter
            restart: always
            network_mode: host
            privileged: true
            cap_add:
              - NET_RAW
            volumes:
              - /srv/docker/monitor/blackbox-exporter/conf/blackbox.yml:/etc/blackbox_exporter/blackbox.yml:ro
            command:
              - "--config.file=/etc/blackbox_exporter/blackbox.yml"

          # alertmanager:
          #   image: prom/alertmanager:latest
          #   container_name: monitor-alertmanager
          #   restart: always
          #   network_mode: host
          #   volumes:
          #     - /srv/docker/monitor/alertmanager/alertmanager.yml:/etc/alertmanager/alertmanager.yml:ro
          #   command:
          #     - "--config.file=/etc/alertmanager/alertmanager.yml"

          prometheus:
            image: prom/prometheus:latest
            container_name: monitor-prometheus
            restart: always
            network_mode: host
            volumes:
              - /srv/docker/monitor/prometheus/conf/prometheus.yml:/etc/prometheus/prometheus.yml:ro
              # - /srv/docker/monitor/prometheus/conf/alert_rules.yml:/etc/prometheus/alert_rules.yml:ro
              - /srv/docker/monitor/prometheus/data:/prometheus/data
            command:
              - "--config.file=/etc/prometheus/prometheus.yml"
              - "--web.enable-lifecycle"
            depends_on:
              - node-exporter
              # - alertmanager

          grafana:
            image: grafana/grafana:nightly
            container_name: monitor-grafana
            restart: always
            network_mode: host
            volumes:
              - /srv/docker/monitor/grafana/data:/var/lib/grafana
            depends_on:
              - prometheus
            environment:
              - GF_SERVER_ROOT_URL=https://monitor.tiankaima.dev/
              - GF_SERVER_DOMAIN=monitor.tiankaima.dev
              - GF_SECURITY_ADMIN_USER=${GRAFANA_ADMIN_USER}
              - GF_SECURITY_ADMIN_PASSWORD=${GRAFANA_ADMIN_PASSWORD}
              - GF_USERS_ALLOW_SIGN_UP=false
              - GF_AUTH_ANONYMOUS_ENABLED=true # (1)
              - GF_AUTH_ANONYMOUS_ORG_ROLE=Viewer # (2)
        ```

        1. 允许匿名查看。
        2. 匿名用户权限为 `Viewer`。

    === "prometheus.yml"

        ```yaml title="/srv/docker/monitor/prometheus/conf/prometheus.yml"
        global:
          scrape_interval: 15s

        alerting:
          alertmanagers:
            - static_configs:
                - targets: ['localhost:9093']

        #rule_files:
        #- alert_rules.yml

        scrape_configs:
          - job_name: 'node_exporter'
            static_configs:
              - targets:
                  - cls1-srv1:9100
                  - cls1-srv2:9100
                  - cls1-srv3:9100
                  - cls1-srv4:9100
                  #- cls1-srv5:9100
                  - cls2-srv1:9100
                  - cls2-srv2:9100
                  - cls2-srv3:9100
                  - cls2-srv4:9100
                  - cls2-srv5:9100
                  - cls2-srv6:9100
                  - cls2-srv7:9100

          - job_name: 'dcgm_exporter'
            static_configs:
              - targets:
                  - cls1-srv1:9400
                  - cls1-srv2:9400
                  - cls1-srv3:9400
                  - cls1-srv4:9400
                  #- cls1-srv5:9400
                  - cls2-srv1:9400
                  - cls2-srv2:9400
                  - cls2-srv3:9400
                  - cls2-srv4:9400
                  - cls2-srv6:9400
                  - cls2-srv7:9400

          - job_name: 'blackbox_https_sites_ipv4'
            metrics_path: /probe
            params:
              module: [https_tls_ipv4]
            static_configs:
              - targets:
                  - https://coder.lab.tiankaima.cn:8443
                  - https://headscale.lab.tiankaima.cn/health

            relabel_configs:
              - source_labels: [__address__]
                target_label: __param_target
              - source_labels: [__param_target]
                target_label: instance
              - target_label: __address__
                replacement: localhost:9115

          - job_name: 'blackbox_https_sites_ipv6'
            metrics_path: /probe
            params:
              module: [https_tls_ipv6]
            static_configs:
              - targets:
                  #- https://coder.lab.tiankaima.cn:8443
                  - https://headscale.lab.tiankaima.cn/health

            relabel_configs:
              - source_labels: [__address__]
                target_label: __param_target
              - source_labels: [__param_target]
                target_label: instance
              - target_label: __address__
                replacement: localhost:9115

          - job_name: 'blackbox_ping_cluster'
            metrics_path: /probe
            params:
              module: [ping_ipv4]
            static_configs:
              - targets:
                  - cls1-gateway
                  - cls1-srv1
                  - cls1-srv2
                  - cls1-srv3
                  - cls1-srv4
                  - cls2-srv1
                  - cls2-srv2
                  - cls2-srv3
                  - cls2-srv4
                  - cls2-srv5
                  - cls2-srv6
                  - cls2-srv7
            relabel_configs:
              - source_labels: [__address__]
                target_label: __param_target
              - source_labels: [__param_target]
                target_label: instance
              - target_label: __address__
                replacement: localhost:9115

          - job_name: 'tailscale'
            static_configs:
              - targets:
                  - 100.100.100.100

          - job_name: 'headscale'
            static_configs:
              - targets:
                  - 127.0.0.1:9095

          - job_name: 'caddy'
            static_configs:
              - targets:
                  - localhost:2019

          - job_name: 'caddy_gateway'
            scheme: https
            static_configs:
              - targets:
                  - coder.lab.tiankaima.cn:8443

          - job_name: 'coder'
            static_configs:
              - targets:
                  - cls1-gateway:2112
        ```

    === "alert_rules.yml"

        ```yaml title="/srv/docker/monitor/prometheus/conf/alert_rules.yml"
        groups:
          - name: node_down_alerts
            rules:
              - alert: HostDown
                expr: up == 0
                for: 1m
                labels:
                  severity: critical
                annotations:
                  summary: "Host {{ $labels.instance }} is down"
                  description: "Prometheus failed to scrape {{ $labels.job }} on {{ $labels.instance }} for more than 1 minute."
        ```

=== "cls1-gateway"

    === "docker-compose.yml"
    
        ```yaml title="/srv/docker/monitor/docker-compose.yml"
        services:
          node-exporter:
            image: prom/node-exporter
            container_name: monitor-node-exporter
            restart: always
            pid: "host"
            network_mode: "host"
            volumes:
              - "/:/host:ro,rslave"
            command:
              - "--path.rootfs=/host"

          prometheus:
            image: prom/prometheus
            container_name: monitor-prometheus
            restart: always
            network_mode: "host"
            volumes:
              - /srv/docker/monitor/prometheus/conf:/etc/prometheus
              - /srv/docker/monitor/prometheus/data:/prometheus
            depends_on:
              - node-exporter

          #prometheus-merged:
          #image: prom/prometheus
          #container_name: monitor-prometheus-merged
          #restart: always
          #network_mode: "host"
          #volumes:
          #- /srv/docker/monitor/prometheus.merged/config:/etc/prometheus
          #- /srv/docker/monitor/prometheus.merged/data:/prometheus
          #command: --web.listen-address=:9091 --config.file=/etc/prometheus/prometheus.yml
          #depends_on:
          #- node-exporter

          grafana:
            image: grafana/grafana-oss
            container_name: monitor-grafana
            restart: always
            volumes:
              - /srv/docker/monitor/grafana/grafana.ini:/etc/grafana/grafana.ini
              - /srv/docker/monitor/grafana/data:/var/lib/grafana
              - /srv/docker/monitor/grafana/log:/var/log/grafana
            depends_on:
              - prometheus
            environment:
              - https_proxy=http://grafana.proxy.lab.tiankaima.cn:7890
              - http_proxy=http://grafana.proxy.lab.tiankaima.cn:7890
              - HTTPS_PROXY=http://grafana.proxy.lab.tiankaima.cn:7890
              - HTTP_PROXY=http://grafana.proxy.lab.tiankaima.cn:7890
              - no_proxy=*.cn,10.9.0.1/24,192.168.48.1/22,cls1-srv1,cls1-srv2,cls1-srv3,cls1-srv4,cls1-srv5,cls2-srv1,cls2-srv2,cls2-srv3,cls2-srv4,cls2-srv5,cls2-srv6,cls2-srv7
            network_mode: "host"
        ```

    === "prometheus.yml"

        ```yaml title="/srv/docker/monitor/prometheus/conf/prometheus.yml"
        # my global config
        global:
          scrape_interval: 5s # Set the scrape interval to every 15 seconds. Default is every 1 minute.
          evaluation_interval: 15s # Evaluate rules every 15 seconds. The default is every 1 minute.
          # scrape_timeout is set to the global default (10s).

        # Alertmanager configuration
        alerting:
          alertmanagers:
            - static_configs:
                - targets:
                  # - alertmanager:9093

        # Load rules once and periodically evaluate them according to the global 'evaluation_interval'.
        rule_files:
          # - "first_rules.yml"
          # - "second_rules.yml"

        # A scrape configuration containing exactly one endpoint to scrape:
        # Here it's Prometheus itself.
        scrape_configs:
          - job_name: "prometheus"
            static_configs:
              - targets: ["localhost:9090"]
          - job_name: "node"
            static_configs:
              - targets:
                  - "localhost:9100"
                  - "localhost:9400"
        ```
