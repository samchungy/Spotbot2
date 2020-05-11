#!/bin/bash
echo 'ℹ️  Updating packages ℹ️'
for d in ./layers/*/ ; do (cd "$d" && npm update && npm audit fix); done
echo '✅ Copied files to /opt ✅'
echo 'ℹ️  Copying node_modules to /opt ℹ️'
cp -r /opt/nodejs/node_modules /opt
cp /opt/nodejs/package.json /opt
echo '✅ Copied node_modules to /opt ✅'
