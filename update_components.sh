#!/bin/bash

cp -r kb/graph_drawings/ ../kb/
rsync --recursive sc-web/ ../sc-web/
cat files_for_addition/add_to_common.html>>../sc-web/client/templates/common.html
cat files_for_addition/add_to_components.html>>../sc-web/client/templates/components.html
