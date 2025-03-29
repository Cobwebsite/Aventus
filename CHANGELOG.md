# Change Log

## 1.3.9 (2025-03-29)

### Bug Fixes
 - Fix drag&drop to get right position for svg and htmlelement
 - Fix import methods if no "region methods" found

### Features
 - Add custom-elemments.json generation
 - Add html-custom-data.json generation
 - Add web-types.json generation
 - Auto detect new html-custom-data.json inside your project and ask to add it into your vscode settings
 - Change Callback to have a list of params instead of an array
 - Add global press event on PressManager
 - Add Watch function on Watcher
 - Beta : replace template.avt by template.avt.ts to create custom script logic for templating
 - Add tag &lt;a href&gt; inside RouterLink

## 1.3.8 (2025-01-26)

### Bug Fixes
 - Correct missing types inside HttpRouter
 - Allow support for exported async function
 - Force error message to be a string
 - Allow reload when external package changed
 - Remove watcher before sending httprequest
 - Fix escape inside css file

### Features
 - Add support for svg inside Drag&drop

## 1.3.7 (2024-12-30)

### Bug Fixes
 - Prevent concurrency during config saving
 - Correct linux import for package

### Features
 - Improve error message


## 1.3.6 (2024-12-26)

### Bug Fixes
 - Escape " into attributes
 - Correct @Bindthis

### Features
 - Add @Injectable
 - Add getActiveElement on webcomponent
 - Add function to append style to head
 - Add useDefaultTemplate to disable default aventus template


## 1.3.5 (2024-11-27)

### Bug Fixes
 - Correct BindThis to add parameters (actually wrong typing but not important for package and build)

## 1.3.4 (2024-11-26)

### Bug Fixes
 - Correct Touch in PressManager

### Features

## 1.3.3 (2024-11-24)

### Bug Fixes
 - Correct @BindThis for all class

### Features

## 1.3.2 (2024-11-24)

### Bug Fixes
 - Npm export will now correctly add dependance to html tag
 - Correct @BindThis when no constructor
 - Correct remove error force ! when default value or ! exist
 - Correct http package link
 - Npm will now be exported as module package
 - Fix TouchEvent inside PressManager

### Features
 - Add aventus.readDirs settings
 - Add protected to storybook options
 - Add NoLive to storybook options
 - Change logo (YEEEAAAH !!!)
 - Upgrade to AventusSharp 0.0.5

## 1.3.1 (2024-10-19)

### Bug Fixes
 - Correct namespace export inside npm
 - Hot fix client error on import codeAction
 - Remove @inheritdoc from documentation display

### Features
 - Add slot support for storybook
 - Change template support (maybe you must reimport templates from Aventus)

## 1.3.0 (2024-07-17)

### Bug Fixes
 - Prevent namespace updating when name of getter/setter is a type name
 - Correct dependance fullname for generic class inheritance

### Features
 - Export AventusJs to npm package
 - Export AventusJs to storybook
 - Improve documentation inside typescript code


## 1.2.1 (2024-04-28)

### Bug Fixes
 - Correct property and attribute inheritance
 - Correct property and attribute loading for html autocompletion
 - Init state only when the component is renderered
 - Disable loop check on htmlElement inside fct compareObject
 - Correct the getType inside the TsLanguageService to get fullname
 - Correct the CompareObject to avoid error when comparing null Date
 - Add a function to avoid bypassing getter and setter when a component a loaded after some props were already assigned
 - Correct the date and datetime property or attribute on the webcomponent
 - Keep the comment format to // inside style file. Before it was transformed to /* */
 - Correct the ActionGuard that wasn't working because of array reference instead of compare
 - Upgrade CustomElement inside template instead of Element to avoid error during loop and conditional
 - Force uri compare to be lowercase
 - Correct infinite loop on RAM for updateList and createList
 - Correct the callback return when binding event though the view

### Features
 - Add $ to use as @bind
 - Add clone method to IData
 - Automatic detection of file inside http request to send multipart content
 - Add global config into PressManager
 - Add function to extract and trigger Watcher
 - Add RamItem function with errors as return
 - Add Asyncable and Async to easly manage result that can be a promise or not
 - Add function getAsString and sheetToString to get the CSSStyleSheet as a string
 - Reformat webcomponent life cycle with postCreation/postConnect/postDisonnect/postDestruction
 - Automatically call the destructor when `remove` is called on a webcomponent
 - Destroy children recursively when destroy is called on a webcomponent
 - Show only the live server button when Aventus is ready and have a project
 - C# error can now be readed inside a file if compilation failed
 - Add import from *.package.avt
 - Add hover and definition inside *.package.avt
 - Support import any style file inside aventus style file
 - Allow to provide the scope for the Callback
 - Add a isClass helper method


## 1.2.0 (2024-02-24)

### Bug Fixes
 - Correct Watcher to have right path on callback based on where subscribe is called
 - Prevent exporting two times the same tags inside the same output file
 - Correct using regex char inside directory

### Features
 - Change templating by adding for and if inside wcv.avt
 - Add (Effect|Computed)NoRecomputed to calculate dependance graph only during first query
 - Add File support inside HttpRequest
 - Add Prefix inside HttpRoute
 - StateManager can allow or deny state change
 - Simplify aventus.conf.avt
 - Replace global webcomponent style (.gwcs.avt) by a normal style file stating with a @
 - Support ./* and ../* inside the state manager
 - When creating *.wc.avt it does not create a folder
 - Add command to create variable inside *.wcs.avt


## 1.1.1 (2024-01-12)

### Bug Fixes
 - Correct dependances parsing
 - Correct error index inside view loop
 - Loop in proxy avoid __path and __proxyData
 - Prevent undefined value inside the webcomponent template
 - Correct 2 times public when auto creating methods from parent
 - Replace Decorators by position instead of using regex
 - Increase performance by avoiding buffering when typing fast inside big file

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