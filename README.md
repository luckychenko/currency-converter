# Wittr

This is a silly little demo app for an offline-first course.

You could run the app by using machine dependnecies

## Running using local machine

### Installing

Dependencies:

* [Node.js](https://nodejs.org/en/) v0.12.7 or above

Then check out the project and run:

```sh
npm install
```

### Running

```sh
npm run serve
```

### Using the app

You should now have the app server at [localhost:8008](http://localhost:8008)




## Troubleshooting

* Errors while executing `npm run serve`.
  * The first thing to try is to upgrade to latest version of node.
  * If latest version also produces errors, try installing v4.5.0.
    * An easy fix for that would be [to use `nvm`](http://stackoverflow.com/a/7718438/1585523).
* If you get any node-sass errors, try running `npm rebuild node-sass --force` or the remove `node_modules` folder and run `npm install` again
