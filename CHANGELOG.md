# Change Log

## 1.1.1 (--)

### Bug Fixes
 - Correct dependances parsing
 - Correct error index inside view loop

### Features
 - Add error when npm build failed
 - Remove socket from core and set it inside Sharp
 - Add computed and effect inside Watcher

## 1.1.0 (2023-11-22)

### Bug Fixes
 - Correct npm import logic error ([#5](https://github.com/Cobwebsite/Aventus/issues/5))
 - Correct tree shaking to avoid infinite loop

### Features
 - Detect classes inside view and style and allow the ctrl + click to navigate between files
 - Improve compiled file to have same classes name inside different namespaces
 - Add url **/?get_injected_code** to live to get the hotreload from other tools
 - Add auto port mapping for live server
 - Improve the **scrollbar** to be smoother on touch
 - Add **http support** to write router and route inside aventus
 - Add **Cli** that can be download through npm
 - Add an option to avoid stopping event inside **PressManager**
 - Add **aventus.sharp.avt** support to **C#** project by generate code from AventusSharp (C#) to Aventus (Typescript)
 - Force typescript to check **nullable type**
 - Add **followFoldersCamelCase** for the namespace strategy inside **aventus.conf.avt**
 - Add **aliases** inside the **aventus.conf.avt** to replace content inside files


### Internal
 - Change the project structure to create a cli tool for Aventus

## 1.0.101 (2023-07-14)

### Bug Fixes

 - Correct double dependances error ([#3](https://github.com/Cobwebsite/Aventus/issues/3))
 - Correct import from npm ([#4](https://github.com/Cobwebsite/Aventus/issues/4))
 - Correct bug from terser inside rollup

### Features
 - Add compress options inside build to generate a compressed output file