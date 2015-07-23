# Holidays.js
A Moment.js plugin that enables holiday support.
## Installation
### Bower
```
bower install holidays
```
### Browser
Just include `Holidays.js` in your page **after** you have loaded `Moment.js`.
```
<script src="moment.js" type="text/javascript"></script>
<script src="Holidays.js" type="text/javascript"></script>
```
## Usage
### `.holiday()` and `.holidays()`
If you want to tell if a moment is a holiday, use `.holiday()`.
```
var isHoliday = moment('2015-12-25', 'YYYY-MM-DD').holiday(); // true
```
If you want to list the names of a moment's holidays, use `.holidays()`.
```
var christmas = moment('2015-12-25', 'YYYY-MM-DD').holidays(); // ["Christmas"]
```
### Country code
By default, dates retrieved correspond to the US holiday calendar, but you can change this setting using `.countryCode()`.
#### Get
```
var country_code = moment().countryCode();
```
#### Set
```
moment().countryCode('FR');
```
Holiday names will be displayed in the native language corresponding to the country code (e.g. English for `US`, French for `FR`...).
### Cache and preloading
This plugin uses a web service to retrieve holidays by year using **synchroneous** HTTP GET requests. To avoid unnecessary requests and blocking time due to network delays, `Holidays.js` caches holidays.

Though it will create an additional initial loading time, you can ask `Holidays.js` to preload holidays for certain years. To do so, call `.preloadHolidays()` providing an array of years.
```
moment().preloadHolidays([2015,2016]);
```
## Contributing
1. Fork it!
2. Create your feature branch: `git checkout -b my-new-feature`
3. Commit your changes: `git commit -am 'Add some feature'`
4. Push to the branch: `git push origin my-new-feature`
5. Submit a pull request :D

## History
v0.1.0
  * Check if day is a holiday
  * List moment holidays
  * Get or set country code
  * Preload years
  * Holidays are cached

## Credits
[Geoffroy EMPAIN](http://empain.eu)

[Josh Sherman](http://joshtronic.com/?ref=holidayapi) for its holiday API
## License
MIT
