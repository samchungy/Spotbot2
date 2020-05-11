#!/bin/bash
echo 'ℹ️  Copying files to /opt ℹ️'
for d in ./layers/*/ ; do (cd "$d" && cp -r . /opt); done
echo '✅ Copied files to /opt ✅'
echo 'ℹ️  Copying node_modules to /opt ℹ️'
cp -r /opt/nodejs/node_modules /opt
cp /opt/nodejs/package.json /opt
echo '✅ Copied node_modules to /opt ✅'
