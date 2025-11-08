exit_after_auth = false
pid_file = "/tmp/vault-agent.pid"

vault {
  address = "http://127.0.0.1:8200"

  tls_skip_verify = true

  retry {
    min = "250ms"
    max = "5s"
  }
}


auto_auth {
    method "token_file" {
        config = {
            token_file_path = "/vault/config/devtoken"
        }
    }
    sink "file" {
        config = {
            path = "/run/secrets/vault_token"
        }
    }
}

template {
    source  = "/vault/templates/app.env.ctmpl"
    destination = "/run/secrets/app.env"
    command = "sh -c 'chmod 0400 /run/secrets/app.env'"
    perms = "0400"

    wait {
        min = "2s"
        max = "5s"
    }
}
