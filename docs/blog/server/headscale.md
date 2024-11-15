# Headscale Setup

> Official Site: https://headscale.net/
>
> tl;dr: a self-host version of tailscale, providing more controls but less features

最近折腾组网，看了下 Tailscale 看起来不错，不过不确定 Tailscale 会不会被 GFW gank，于是研究起了 Headscale

## Control Plane

### Installation

> https://headscale.net/setup/install/official/

1. `$ wget *.deb` (in GitHub Release)
2. `# apt install ./*.deb`
3. `# vim /etc/headscale/config.yaml`
4. `# systemctl enable --now headscale`
5. `# systemctl status headscale`

### headscale-ui

> https://github.com/gurucomputing/headscale-ui

Pure static site, so no access control is required (all actions are performed at the frontend, including api key storage)

!!! note

    we'll deploy the static site at `/web/` to avoid CORS messes, you could even deploy it to another site, say `control.headscale.****.****` for example, but additional settings in rev proxy is needed, and I would just recommend you to deploy it at `/web/` and use the same domain for simplicity

1. `$ wget *.zip` (in GitHub Release)
2. `$ unzip *.zip -d /var/www/html-headscale-ui`
3. `$ vim /etc/caddy/Caddyfile`

### Caddy

Caddy would magically handle everything even with HTTPS, so yay!

```txt title="/etc/caddy/Caddyfile"
headscale.****.**** {
        handle_path /web* {
                root * /var/www/html-headscale-ui
                file_server
        }

        reverse_proxy * 127.0.0.1:8080
}
```

Now go to `headscale.****.****/web/`, but first create a API key with:

```bash
headscale apikeys create --expiration 999d # or whatever
```

Paste it in the browser, and you're good to go! (Note how the API key is stored locally, try a Private Window if you're paranoid)

## Client

### Installation

Just install it as a normal tailscale setup:

```bash title="Linux"
curl -fsSL https://tailscale.com/install.sh | sh
```

for macOS users, try Homebrew instead of App Store version, which provides you with CLI interface.

!!! warning

    DO NOT install the non-cask version on homebrew alongside an App Store version, apparently they don't commmunicate, at all.

    You could install a CLI only version with a `tailscale` + `tailscaled`, but why?

#### Login

To connect to the control plane, use:

> Create a preauth key on the aforementioned headscale-ui page

```bash
tailscale up --login-server <URL> --authkey <KEY>
```

## Features

### Docker subnet

One great way to use the new intranet you just setup, is to assign a subnet to the docker network for each machine, so each container would have its own IP address, and would perform just as a regular system, without the need to perform port fowarding, rev proxy on host ... etc.

Here's a step-by-step to show you how to do it:

!!! note

    With defaultd config, headscale will assign `10.60.0.1/24` for the client network, so I'm planning the following address:

    - `10.60.0.1` would get a `10.8.1.0/24` subnet
    - `10.60.0.2` would get a `10.8.2.0/24` subnet
    - ...

    Adjust the following steps according to your own network settings

#### Modifying default `docker0`

!!! warning

    I should really give you some heads up on this:

    - Assigning every docker container to the default bridge network would allow them to communicate with each other freely, leading to potential security risks.

    - With default bridge network, you CAN'T manually assign IP to container, you'll get the following message:

        ```
        docker: Error response from daemon: invalid config for network bridge: invalid endpoint settings: user specified IP address is supported on user defined networks only
        ```

!!! note

    You can modify docker compose to join the default network like this:

    ```yaml title="docker-compose.yml"
    services:
        ****:
            image: ****
            restart: unless-stopped
            ports:
            - "**:**"
            network_mode: bridge
    ```

    NOTE: This breaks discovery, so you'll need to use `--link` or `--network` to connect containers again.

Modify `/etc/docker/daemon.json` and add:

```json title="/etc/docker/daemon.json"
{
    (...)
    "bip": "10.8.1.1/24"
}
```

!!! warning

    See https://github.com/moby/moby/issues/22638#issuecomment-263932574

    Use IP/netmask address, not subnet/netmask address. tl;dr use `.1` not `.0`

You'll need to restart Docker after this, supposing with `systemd` installation:

```bash
sudo systemctl restart docker
```

!!! warning

    Docker now have a special `live-restore` option, which would prevent containers from stopping when reloading daemon.

    In this case this is NOT desired, you must stop all containers for it to assign new IP addresses.

#### Create a new subnet

```bash title="docker-subnet.sh"
#!/bin/sh

set -xe

docker network create \
        -d bridge \
        --attachable \
        --subnet 10.8.1.0/24 \
        --ip-range 10.8.1.0/24 \
        --gateway 10.8.1.1 \
        inet
```

Attaching docker compose to this network is easy:

```yaml title="docker-compose.yml"
networks:
    default:
        name: inet
        external: true
```

With `docker run`, use:

```bash
docker run --network inet --ip <IP> ****
```

#### Enable IP forwarding

> https://tailscale.com/kb/1019/subnets#connect-to-tailscale-as-a-subnet-router

```bash
echo 'net.ipv4.ip_forward = 1' | sudo tee -a /etc/sysctl.d/99-tailscale.conf
echo 'net.ipv6.conf.all.forwarding = 1' | sudo tee -a /etc/sysctl.d/99-tailscale.conf
sudo sysctl -p /etc/sysctl.d/99-tailscale.conf
```

#### Broadcast Route to Headscale

```bash
#!/bin/sh

set -xe

tailscale up \
        --advertise-routes=10.8.1.0/24 \
        --accept-routes \
        --login-server=<URL> \
        --authkey <KEY>
```

#### Approve the route in the control plane

Again this could be done with the web page, or with the CLI:

```bash
sudo headscale routes list
sudo headscale routes enable -r <ID>
```

### ACL rules

ACL rules enables more detailed control over the network, allowing you to control who can access what, and who can't, with `autoApprovers` you could automatically approve certain routes.

> To use ACLs in headscale, you must edit your config.yaml file. In there you will find a `policy.path` parameter. This will need to point to your ACL file. More info on how these policies are written can be found [here](https://tailscale.com/kb/1018/acls)

```yaml title="/etc/headscale/config.yaml"
policy:
    path: /etc/headscale/acl.json
```

My config as example:

```json title="/etc/headscale/acl.json"
{
    "groups": {
        "group:admin": ["tiankaima"]
    },
    "tagOwners": {
        "tag:tiankaima": ["tiankaima"],
        "tag:tkm-servers": ["tiankaima"],
        "tag:lab-servers": ["group:admin"]
    },
    "autoApprovers": {
        "routes": {
            "10.8.1.0/24": ["tiankaima"],
            "10.8.2.0/24": ["tiankaima"],
            "10.8.3.0/24": ["tiankaima"],
            "10.8.4.0/24": ["tiankaima"],
            "10.8.5.0/24": ["tiankaima"],
            "10.10.1.0/24": ["tiankaima"],
            "10.10.2.0/24": ["tiankaima"],
            "10.10.3.0/24": ["tiankaima"],
            "10.10.4.0/24": ["tiankaima"],
            "10.10.5.0/24": ["tiankaima"]
        }
    },
    "acls": [
        {
            "action": "accept",
            "src": ["tiankaima"],
            "dst": ["*:*"]
        }
    ]
}
```
