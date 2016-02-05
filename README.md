## Hosting your own version

If you want to host or run the builders with your own set of elements then you
should follow below steps.

1. Fork the project (only necessary if you want to host your own public version)
2. Clone the project (clone the forked project if you have a fork)
3. Follow the [installation][2] and [development workflow][3] related steps

### Adding Elements

Once you have a working development environment setup you are ready to add
new elements to the builder. Follow the below steps to add new elements.

#### Requirements
Before you proceed with any of the below steps you should make sure that your element
satisfies following conditions.
For more information on the element structure read this [document][5].

1. `property.json`: Used to build the property panel. More [here][4]
2. `demo/index.html`: Used for grabbing the code added when you drag an element in the canvas. More [here][6]
3. The element should actually contain a _component file by its name_.

#### Installation
Install the element using `bower`. For example `bower install --save AtomElements/t-button`.
Read the bower [docs][1] for more options on installing packages and dependencies.

#### Import
Once you install the element you have to import it in the application.
Importing is done by adding a `link ` tag in `app/elements.html` file.
Have a look at other imports in the file for an example.

#### Metadata
You will also have to add an entry for the new element in either `form-manifetst.json` or `page-manifest.json` files located in `app` folder.
These files are used to generate the navigation panel you see in a builder on left hand side.
The files are of `json` format and you have to add a new object in `elements` array per new element added, you can also
add a new category. You will notice properties like `displayName`, `icon`, `name` etc in the file, following is a
description of each allowed property and its meaning.

1. `displayName` (required): The name that will be displayed for an element in the navigation panel
2. `icon` (optional): Icon to be shown for the element (we don't currently support custom icons, [available icons][7])
3. `category` (required): The element will be categorized under this category
4.: `name`: (required): This should be the name of the element

#### Deploy
The task bundled in this project only supports deploying to [gh-pages][8]. You also need to have
forked this project. To deploy simply run `gulp build-deploy-gh-pages`. Once the task
completes successfully you should be able to see your own version at `http://<your_user_name>.github.io/create/`.


#### List of supported icons

* Autosuggest
* Button
* Calendar
* Checkbox
* Color_Palette
* download
* Dropdown
* Flight
* Image
* Image_Gallery
* Input_Field
* Loader
* map
* Map
* Progress_bar
* Radio_List
* Scaffold
* Section_Header
* Slider
* Table
* upload
* Video

[1]: https://github.com/bower/bower#installing-packages-and-dependencies
[2]: https://github.com/PolymerElements/polymer-starter-kit#install-dependencies
[3]: https://github.com/PolymerElements/polymer-starter-kit#development-workflow
[4]: https://github.com/atomproject/docs/blob/master/how-property-panel-works.md
[5]: https://github.com/atomproject/docs/blob/master/creating-an-element.md
[6]: demo_index
[7]: /list-of-supported-icons/
