# Headscale Setup

> Official Site: https://headscale.net/
>
> tl;dr: a self-host version of tailscale, providing more controls but less features

最近折腾组网，看了下 Tailscale 看起来不错，不过不确定 Tailscale 会不会被 GFW gank，于是研究起了 Headscale

## Control Plane

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

### Tailscale

Just install it as a normal tailscale setup:

```bash title="Linux"
curl -fsSL https://tailscale.com/install.sh | sh
```

for macOS users, try Homebrew instead of App Store version, which provides you with CLI interface.

!!! warning

    DO NOT install the non-cask version on homebrew alongside an App Store version, apparently they don't commmunicate, at all.

    You could install a CLI only version with a `tailscale` + `tailscaled`, but why?

### Headscale

To connect to the control plane, use:

> Create a preauth key on the aforementioned headscale-ui page

```bash
tailscale up --login-server <URL> --authkey <KEY>
```

### Docker subnet

One great way to use the new intranet you just setup, is to assign a subnet to the docker network for each machine, so each container would have its own IP address, and would perform just as a regular system, without the need to perform port fowarding, rev proxy on host ... etc.

Here's a step-by-step to show you how to do it:

!!! note

    The headscale assigned `10.60.0.1/24` (?) for the client network in my case, so I'm planning the following address:

    - `10.60.0.1` would get a `10.8.1.0/24` subnet
    - `10.60.0.2` would get a `10.8.2.0/24` subnet
    - ...

    Adjust the following steps according to your own network settings

!!! note

    I'm also just going to modify the default docker network, aka `docker0` instead of a new docker network for simplicity

!!! warning

    I should really give you some heads up on this, with the modifying of default bridge network.

    Assigning every docker container to the default bridge network would allow them to communicate with each other freely, leading to potential security risks.

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

!!! note

    I actually haven't figured out a way to just assign IP for containers in docker-compose or just `docker run`, let me know if you've got a solution.

    For now, I guess you'll need to `docker ps -a` and then `docker inspect | grep 10.8` to find out

1.  Docker tweaks:

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

2.  Enable IP forwarding:

    > https://tailscale.com/kb/1019/subnets#connect-to-tailscale-as-a-subnet-router

    ```bash
    echo 'net.ipv4.ip_forward = 1' | sudo tee -a /etc/sysctl.d/99-tailscale.conf
    echo 'net.ipv6.conf.all.forwarding = 1' | sudo tee -a /etc/sysctl.d/99-tailscale.conf
    sudo sysctl -p /etc/sysctl.d/99-tailscale.conf
    ```

3.  Broadcast Route to Headscale:

    ```bash
    sudo tailscale up --advertise-routes=10.8.1.0/24 --login-server <URL>
    ```

    > after a successful login, the authkey param isn't needed anymore

4.  Approve the route in the control plane

    Again this could be done with the web page, or with the CLI:

    ```bash
    sudo headscale routes list
    sudo headscale routes enable -r <ID>
    ```
