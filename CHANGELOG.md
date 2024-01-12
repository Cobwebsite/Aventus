# Change Log

## 1.1.1 (2024-01-12d)

### Bug Fixes
 - Correct dependances parsing
 - Correct error index inside view loop
 - Loop in proxy avoid __path and __proxyData
 - Prevent undefined value inside the webcomponent template
 - Correct 2 times public when auto creating methods from parent
 - Replace Decorators by position instead of using regex
 - Increase performance by avoiding buffering whne typing fast inside big file

### Features
 - Add error when npm build failed
 - Remove socket from core and set it inside Sharp
 - Add computed and effect inside Watcher
 - Add Uri parser (used by state)
 - Exctract a pattern to add route into a class (Communication lib)
 - Generalise the converter to transform data to real json with customisation (class Converter and Json)
 - State file (*.state.avt) must now implements Aventus.IState or Aventus.IStateManager
 - Change tag name parser. Now the tag is splitted on each lower case or number
 - Add section to define how to auto-generate httprouter from C# project
 - Add Decorator @Internal and @InternalProtected to allow public accessibility only on the current module



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