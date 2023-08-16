# js Folder

In this folder are several subfolders:

- cars
- dashboard
- data-sources
- editor
- lib
- power-ups
- test
- other files ...

## cars

The code in this directory is related to showing cars on the roads of a MapView. It does not need to be touched for this project. Would be cool, if the other tile types would be as nice as this.

## dashboard

Most of this is not used in this project, since power up and the action elements are not longer used.
They are just a leftover from the future mobility parent project.

## data-sources

Here the main calculations will be done. The postfix \_OLD refers to an unused file from the parent project. This is caused by changes done in the original file but to keep the old file, too, it got the postfix.

File(s) with the postfix \_WT refer to files added for this project. WT stands for wind turbine. Currently only one file contains this postfix, that is the file for calculations with the data type wind turbine. Here it gets checked, of the amount of energy is less, more or equal to the required amound and if the distances between wind turbines and the other objects as well as other wind turbines will be kept.

## editor

Here are files from the original project, too. They are marked with the postfix \_OLD and are not used any longer. The contained files are for getting used by editor.html. The modal-....js files are used for exporting, importing, loading, saving and storing scenarios. Power ups is connected with the power-ups folder.

## lib

These are helper functions and classes from the original project.

## power-ups

Power ups are a leftover from the original project. They were use to manipulate the future mobility influencing aspects. In this project they are not used.

## test

scenarios.js is a file from the original project.
cities.json contains two different example scenarios that can be loaded by an action button in the index.html file.

## Remaining files in the js folder

This folder contains several files. They are all taken from the original project and partly modified for our use case. Those files contain a matching file with the postfix **\_OLD**.

The **main[-...].js** files are getting used to fill the html pages in src/html. They already got a structure and contain several containers, but these have to be filled by these files.

## Miscellaneous

Code snippets that are commented out are part of the old project and for this use case no longer required. We kept them in case something will be needed in the future.

Files that have the word **-view-** as part of their name, are components that are standalone or in combination with other component elements of the html page.
