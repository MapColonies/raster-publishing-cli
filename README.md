# Map Colonies raster publishing cli

----------------------------------

![badge-alerts-lgtm](https://img.shields.io/lgtm/alerts/github/MapColonies/raster-publishing-cli?style=for-the-badge)

![grade-badge-lgtm](https://img.shields.io/lgtm/grade/javascript/github/MapColonies/raster-publishing-cli?style=for-the-badge)

![snyk](https://img.shields.io/snyk/vulnerabilities/github/MapColonies/raster-publishing-cli?style=for-the-badge)

----------------------------------

This is a cli tool to publish raster layers from prepared tiles
## usage

- create csv file with the following columns:
  - ```productId``` (required)
  - ```productName``` (required)
  - ```productVersion``` (required)
  - ```productType``` (required - must be map colonies supported product type)
  - ```productSubType``` (optional)
  - ```description``` (optional)
  - ```sourceDateStart``` (required - format dd/mm/yyyy)
  - ```sourceDateEnd``` (required - format dd/mm/yyyy)
  - ```maxResolutionDeg``` (required)
  - ```maxResolutionMeter``` (required)
  - ```minHorizontalAccuracyCE90``` (required)
  - ```footprint``` (required - format polygon/multipolygon geoJSON)
  - ```region``` (optional - values need to be separated by ```,```)
  - ```classification``` (required - must be valid map colonies raster classification)
  - ```sensors``` (optional - values need to be separated by ```,```. if empty, default value is set as 'UNDEFINED')
  - ```scale``` (optional)
  - ```tilesPath``` (required - map colonies deployment relative layer tiles path)
  - ```storageProvider``` (required - tiles source type, must be ```FS``` or ```S3```)
  - ```format``` (required - tiles image format, must be ```image/png``` or ```image/jpeg```)
- run cli with ```node <cli index path> <csv file path>```
