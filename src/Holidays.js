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
    /* Standard Moment.js plugin code. */
    var moment = typeof require !== "undefined" && require !== null ? require("moment") : this.moment;

    /**
     * Holidays web service url.
     * @type {string}
     */
    var feed = "https://holidayapi.com/v1/holidays?";

    /**
     * Contains holidays (as arrays of objects) for certain years (as keys).
     * First level keys are years, second level keys are country codes.
     * Third level contains cache entries created by @function createCacheEntry.
     * @type {{}}
     */
    var cache = {};

    /**
     * Country code (required) to retrieve holidays from the web service.
     * @see <a href="http://holidayapi.com">http://holidayapi.com</a>
     * @type {string}
     */
    var country_code = "US";

    /**
     * Holidays web service requires an API key to make a valid request.
     * Request an API key at http://holidayapi.com
     * Before requiring Holidays.js, add your API like so:
     *
     * <script type="text/javascript">
     *   const holidays_api_key="9f4c25e6-81ba-48b9-FAKE-1ee8c24fd928"
     * </script>
     *
     * The Holidays service will return a 401 Unauthorized error if a key
     * is not provided.
     * @see <a href="http://holidayapi.com">http://holidayapi.com</a>
     * @type {UUID}
    */
    const api_key = holidays_api_key;

    /**
     * Pushes an object containing both successCallback and failureCallback
     * to the queue of callbacks waiting cache[year][countryCode] to finish
     * caching.
     * @param year
     * @param countryCode
     * @param successCallback Callback called when caching cache[year][countryCode] has finished with success.
     * Signature:
     *      function(result)
     * Aruments:
     *      result: Awaited result.
     * @param failureCallback Callback called when caching cache[year][countryCode] has finished with error.
     * Signature
     *      function(error)
     * Arguments:
     *      error: JS error object. May be IO error, JSON error...
     */
    function registerCallbacks(year, countryCode, successCallback, failureCallback) {
        if (cache[year])
            cache[year][countryCode]["callbacks"].push({
                success: successCallback,
                failure: failureCallback
            });
    }

    /**
     * Initialises a cache entry in cache[year][countryCode].
     * @param year
     * @param countryCode
     * @param holidayArray JSON object as parsed from the web service for the {year} and {countryCode}.
     * @param isCaching Tells whether cache[year][countryCode] is being cached.
     */
    function createCacheEntry(year, countryCode, holidayArray, isCaching) {
        if (cache[year] == null)
            cache[year] = {};
        cache[year][countryCode] = {
            holidays: holidayArray,
            caching: isCaching,
            callbacks: []
        };
    }

    /**
     * Performs an asynchronous Http GET request on the provided url.
     * @param url Url to GET.
     * @param success Callback called when query has finished with success.
     * Signature:
     *      function(result)
     * Arguments:
     *      result: Http response.
     * @param failure Callback called when query has finished with error.
     * Signature
     *      function(error)
     * Arguments:
     *      error: JS error object. May be IO error, JSON error...
     */
    function asyncHttpGet(url, success, failure) {
        var xhr = new XMLHttpRequest();
        xhr.open("GET", url, false);
        xhr.onload = function (/*e*/) {
            if (xhr.readyState === 4 && xhr.status === 200 && success) {
                success(xhr.responseText);
            } else if (failure)
                failure(xhr.statusText);
        };
        xhr.error = function (/*e*/) {
            if (failure)
                failure(xhr.statusText);
        };
        xhr.send(null);
    }

    /**
     * Creates and fills a cache entry containing holidays for a
     * specific year and country code.
     * @param year
     * @param countryCode
     * @param success Callback called when caching has finished with success.
     * Signature:
     *      function()
     * @param failure Callback called when caching has finished with error.
     * Signature
     *      function(error)
     * Arguments:
     *      error: JS error object. May be IO error, JSON error...
     */
    function cacheYear(year, countryCode, success, failure) {
        asyncHttpGet(feed+'country='+countryCode+'&year='+year+'&key='+api_key, function(response){
            var json = JSON && JSON.parse(response) || $.parseJSON(response);
            if (json.error == null) {
                createCacheEntry(year, countryCode, json.holidays, false);

                // Execute this callback
                success();

                // Execute all callbacks in the queue
                while (cache[year][countryCode]["callbacks"].length > 0)
                    (cache[year][countryCode]["callbacks"].pop()).success();
            } else {
                // This callback
                failure(json.error);

                // Execute all callbacks in the queue
                while (cache[year][countryCode]["callbacks"].length > 0)
                    (cache[year][countryCode]["callbacks"].pop()).failure();
            }
        }, failure);
    }

    /**
     * Build an array of holiday names for the given year, country code and moment.
     * @param year
     * @param countryCode
     * @param momentObject
     * @returns {Array}
     */
    function make_holidays_array(year, countryCode, momentObject) {
        var names = [];
        var hds = cache[year][countryCode]["holidays"][momentObject.format('YYYY-MM-DD')];
        if (hds != null) {
            for (var hd in hds) {
                if (hds[hd].name != null && hds[hd].name.trim() != "")
                    names.push(hds[hd].name);
            }
        }
        return names;
    }

    function holidays(momentObject, countryCode, success, failure) {
        var year = momentObject.year();

        // Cache year if it isn't.
        if (cache[year] == null || cache[year][countryCode] == null) {
            cacheYear(year, countryCode, function () {
                success(make_holidays_array(year, countryCode, momentObject));
            }, failure);
        } else if (cache[year][countryCode].caching) {
            registerCallbacks(year, countryCode, function () {
                if (success)
                    success(make_holidays_array(year, countryCode, momentObject));
            }, failure);
        } else if (success) {
            success(make_holidays_array(year, countryCode, momentObject));
        }
    }

    /**
     * Empties the cache.
     */
    moment.fn.clearCache = function() {
        cache = {}
    };

    /**
     * Gets or sets the country code used to retrieve holdays from
     * the webservice.
     * @param code @see <a href="http://holidayapi.com">http://holidayapi.com</a>.
     * @returns {string} Currently set country code if {code} is not provided, updated country code otherwise.
     */
    moment.fn.countryCode = function(code) {
        if (typeof code !== "undefined" && code !== null)
            country_code = code;
        return country_code;
    };

    /**
     * List the holidays corresponding to this moment.
     * @param success Success callback.
     * Signature:
     *      function(arr)
     * Arguments:
     *      arr: Array of holiday names corresponding to this moment.
     * @param failure Failure callback.
     * Signature
     *      function(error)
     * Arguments:
     *      error: JS error object, may be IO error, JSON error...
     */
    moment.fn.holidays = function(success, failure) {
        var self = this;
        (function(cc) {
            holidays(self, cc, success, failure)
        })(country_code);
    };

    /**
     * Tells if this moment is a holiday.
     * A moment is a holiday if and only if one or more holidays are
     * assigned to its date (year, month and day).
     * @param success Success callback.
     * @param failure Failure callback.
     */
    moment.fn.holiday = function(success, failure) {
        var self = this;
        (function(cc) {
            holidays(
                self,
                cc,
                function(result){
                    success(result.length > 0);
                },
                failure
            )
        })(country_code);
    };

    /* Standard Moment.js plugin code. */
    if ((typeof module !== "undefined" && module !== null ? module.exports : void 0) != null) {
        module.exports = moment;
    }
}(this));
