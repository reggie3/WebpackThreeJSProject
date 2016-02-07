This project is meant to be a standard template that I can use to create other web apps from.  It includes the following items:

- Visual Studio Code custom settings
    - line wrap at 80 characters
- Standardized folder structure
    - archive for deprecated files
    - source is where editable code lives
        - assets folder: sounds, images, datafiles, etc
        - css: css files and the like
        - scripts: javascript and typescript files files
        - scss: for scss files.  THis folder has the following structure
            - modules directory is reserved for Sass code that doesn't cause Sass to actually output CSS. Things like mixin declarations, functions, and variables
            - partials directory is where my scss files are.
            - vendor for vendor delivered scss files like jquery UI, etc.
    - dist is for the distributable code
- secrets.json file for any user names or passwords that may be needed
- .gitignore file
    - ignores the archive and secrets.json files among others


Installs the following:
- Gulp for running tasks
- browser-sync for live browser reloading
- jade and scss compliers
- Multiple other gulp addins for various tasks.