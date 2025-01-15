# Cluster 2

```bash
for srv in cls2-srv{1...7}; do ssh $srv -t "sudo apt update"; done
```