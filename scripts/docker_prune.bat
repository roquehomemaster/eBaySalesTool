@echo off

echo Cleaning up Docker resources...

echo Removing unused Docker volumes...
docker volume prune -f

echo Removing unused Docker networks...
docker network prune -f

echo Removing stopped Docker containers...
docker container prune -f

echo Clearing Docker build cache...
docker builder prune --all --force

echo Removing unused Docker images...
docker image prune -a -f

echo Docker cleanup complete!