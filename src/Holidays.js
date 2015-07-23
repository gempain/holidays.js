/*
 * The MIT License (MIT)
 *
 * Copyright (c) 2015 Geoffroy EMPAIN.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

/**
 * This plugin depends on a web service to get the holidays. Therefore,
 * it needs to have access to internet to work properly.
 *
 * @see <a href="http://holidayapi.com">http://holidayapi.com</a>
 */
(function() {

    /*********************************
     * Standard Moment.js plugin code.
     *********************************/
    var moment = typeof require !== "undefined" && require !== null ? require("moment") : this.moment;

    /**
     * Holidays web service url.
     * @type {string}
     */
    feed = "http://holidayapi.com/v1/holidays?";

    /**
     * Contains holidays (as arrays of objects) for certain years (as keys).
     * @type {{}}
     */
    var cache = {};

    /**
     * Country code (required) to retrieve holidays from the web service.
     * @see <a href="http://holidayapi.com">http://holidayapi.com</a>
     *
     * @type {string}
     */
    var country_code = "US";

    /**
     * Performs an HTTP GET request.
     *
     * This allows independence from jQuery.
     * @param url
     * @returns {string}
     */
    function syncHttpGet(url) {
        var xmlHttp = new XMLHttpRequest();
        xmlHttp.open("GET", url, false);
        xmlHttp.send(null);
        return xmlHttp.responseText;
    }

    /**
     * Retrieves holidays from the web service.
     * @returns {*}
     */
    function getHolidays(year) {
        textJSON = syncHttpGet(feed+'country='+country_code+'&year='+year);
        var json = JSON && JSON.parse(textJSON) || $.parseJSON(textJSON);
        if (json.error == null) {
            return json.holidays;
        } else
            console.error(json.error);
    }

    function cacheYear(year) {
        cache[year] = getHolidays(year);
    }

    /**
     * Caches holidays for the provided years.
     * @param years Array of years.
     */
    moment.fn.preloadHolidays = function(years) {
        for (var i in years)
            cacheYear(years[i]);
    }

    /**
     * Gets or sets the country code used to retrieve holdays from
     * the webservice.
     * @param code @see <a href="http://holidayapi.com">http://holidayapi.com</a>.
     * @returns {string} The currently set country code if {code} is not provided, null otherwise.
     */
    moment.fn.countryCode = function(code) {
        if (typeof code !== "undefined" && code !== null) {
            country_code = code;

            // Update all years for the new country code.
            for (var year in cache)
                cacheYear(year);
        } else
            return country_code;
    }

    /**
     * Returns an array of holiday names for this moment.
     */
    moment.fn.holidays = function() {
        var names = [];
        var year = this.year();

        // Cache year if it isn't.
        if (cache[year] == null)
            cacheYear(year);

        var hds = cache[year][this.format('YYYY-MM-DD')];
        if (hds != null) {
            for (var hd in hds) {
                if (hds[hd].name != null && hds[hd].name.trim() != "")
                    names.push(hds[hd].name);
            }
        }
        return names;
    };

    /**
     * Tells if a moment is a holiday.
     * @returns {boolean} true if this moment is a holiday, false otherwise.
     */
    moment.fn.holiday = function() {
        return this.holidays().length > 0;
    }

    /*********************************
     * Standard Moment.js plugin code.
     *********************************/
    if ((typeof module !== "undefined" && module !== null ? module.exports : void 0) != null) {
        module.exports = moment;
    }
}(this));