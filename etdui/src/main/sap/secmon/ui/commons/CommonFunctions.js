var ADependencies = [ "sap/secmon/ui/commons/TextUtils", "sap/secmon/ui/commons/Formatter" ];

sap.ui.define(ADependencies, function(TextUtils, Formatter) {
    "use strict";

    sap.secmon.ui.commons.CommonFunctions = function() {
        if (sap.secmon.ui.commons.CommonFunctions.prototype.singletoninstance) {
            return sap.secmon.ui.commons.CommonFunctions.prototype.singletoninstance;
        }
        sap.secmon.ui.commons.CommonFunctions.prototype.singletoninstance = this;
        this._map = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";

        // validator for time in hh:mm:ss format
        this.validateTime = function(control) {
            var val = control.getValue();
            if (!this.parseTime(val)) {
                control.setValueState(sap.ui.core.ValueState.Error);
                return false;
            } else {
                control.setValueState(sap.ui.core.ValueState.None);
                return true;
            }
        };

        /**
         * parses a time value where the format must be hh:mm:ss if the value can be parsed then a date value will be returned otherwise it's value is undefined.
         * 
         * @param sValue
         *            value to be parsed
         * @return parsed value or undefined if it is not parsable
         */
        this.parseTime = function(sValue) {
            var regex = /^([0-1][0-9]|2[0-3]):([0-5][0-9]):([0-5][0-9])$/;
            if (regex.test(sValue)) {
                var hours = sValue.substring(0, 2);
                var minutes = sValue.substring(3, 5);
                var seconds = sValue.substring(6, 8);

                var nowAt = new Date();
                nowAt.setHours(hours, minutes, seconds);

                return nowAt;
            }
        };

        /*
         * Converts a given date object to a date string of format YYYYMMDD Example: 20140717 The date string refers to local time zone.
         */
        this.formatDateToYyyymmdd = function(date) {
            var month = date.getMonth() + 1;
            month = month.toString().length === 1 ? "0" + month : month;
            var day = date.getDate();
            day = day.toString().length === 1 ? "0" + day : day;
            var todayYyyymmdd = date.getFullYear() + "" + month + "" + day;
            // the getFullYear method returns e.g. 2012
            return todayYyyymmdd;
        };

        /*
         * Converts a given date object to a date string of format YYYYMMDD Example: 20140717 The date string refers to time zone UTC.
         */
        this.formatDateToYyyymmddUTC = function(date) {
            var month = date.getUTCMonth() + 1;
            month = month.toString().length === 1 ? "0" + month : month;
            var day = date.getUTCDate();
            day = day.toString().length === 1 ? "0" + day : day;
            var todayYyyymmdd = date.getUTCFullYear() + "" + month + "" + day;
            // the getFullYear method returns e.g. 2012
            return todayYyyymmdd;
        };

        /**
         * parses the specified string which is in format YYYYMMDD as Date-object
         * 
         * @param sValue
         *            date value in the format YYYYMMDD
         * @returns Date Object if it is a valid value or null if not
         */
        this.parseYyyymmdd = function(sValue) {
            var regex = /^(\d{4})(\d{2})(\d{2})$/;

            if (regex.test(sValue)) {
                var matches = sValue.match(regex);

                return new Date(parseInt(matches[1]), parseInt(matches[2]) - 1, parseInt(matches[3]));
            }

            return null;
        };

        this.formatTwoDigits = function(input) {
            return input.toString().length === 1 ? "0" + input : input.toString();
        };

        /*
         * Converts the user input of date and time to a string of format YYYYMMDDhhmmss. Example: 20140717235932 oTimeInput is an input control returning the value in format hh:mm:ss The result
         * string refers to time zone UTC.
         */
        this.formatDateTimeInputToYyyymmddhhmmssUTC = function(oDatePicker, oTimeInput) {
            var d = this.formatDateTimeInputToDate(oDatePicker, oTimeInput);
            return this.formatDateToYyyymmddhhmmssUTC(d);
        };

        /*
         * Converts the specified date and time to a string of format YYYYMMDDhhmmss. Example: 20140717235932 oTimeInput is an input control returning the value in format hh:mm:ss The result string
         * refers to time zone UTC.
         */
        this.formatDateToYyyymmddhhmmssUTC = function(oDate) {
            var result = this.formatDateToYyyymmddUTC(oDate) + this.formatTwoDigits(oDate.getUTCHours()) + this.formatTwoDigits(oDate.getUTCMinutes()) + this.formatTwoDigits(oDate.getUTCSeconds());
            return result;
        };

        /*
         * Converts the user input of date and time to a date object.
         */
        this.formatDateTimeInputToDate = function(oDatePicker, oTimeInput) {
            var date = oDatePicker.getYyyymmdd();
            var time = oTimeInput.getValue();
            var year = date.substring(0, 4);
            var month = date.substring(4, 6);
            var day = date.substring(6, 8);
            var hours = time.substring(0, 2);
            var minutes = time.substring(3, 5);
            var seconds = time.substring(6, 8);
            var d = new Date(year, month - 1, day, hours, minutes, seconds);
            return d;
        };

        // new sap.ui.model.type.Date({source: {pattern: "YYYY-MM-ddTHH:mm:ssZ"}, ..
        this.formatDateTime = function(dVal) {
            // format of UTC time without millisec and with Z for UTC
            var oDateTimeFormat = sap.ui.core.format.DateFormat.getDateTimeInstance({
                pattern : "yyyy-MM-ddTHH:mm:ss"
            });

            // timezoneOffset is in hours convert to milliseconds
            var TZOffsetMs = new Date().getTimezoneOffset() * 60 * 1000;
            // format date and time to strings offsetting to GMT
            return oDateTimeFormat.format(new Date(dVal.getTime() + TZOffsetMs)) + "Z";
        };

        this.dateFormatter = function(val) {
            return Formatter.dateFormatter(val);
        };

        /*
         * oDate is a timestamp provided by a control that runs in local time. The control was used to enter time in UTC time zone. The function corrects the provided timestamp.
         */
        this.adjustTimeInputToUTC = function(oDate) {
            return new Date(oDate.getTime() - oDate.getTimezoneOffset() * 60 * 1000);
        };

        /*
         * oDate is a timestamp provided by the application. A control that runs in local time zone should use the time stamp for time input in UTC time zone. The function corrects the provided
         * timestamp.
         */
        this.adjustDateForInputInUTC = function(oDate) {
            return new Date(oDate.getTime() + oDate.getTimezoneOffset() * 60 * 1000);
        };

        this.handleRequestFailed = function(oEvent, errorMessage) {
            var statusCode = oEvent.getParameters().statusCode;

            var errorDetails = statusCode + " " + oEvent.getParameters().statusText;
            if (statusCode !== 500) {
                errorDetails += "\n" + oEvent.getParameters().responseText;
            }
            var message;
            if (errorMessage) {
                message = errorMessage + "\n" + errorDetails;
            } else {
                message = errorDetails;
            }
            alert(message);
        };

        // Return more useful error message when jQuery returns error
        // (http://api.jquery.com/jQuery.ajax/
        // specifies that errorThrown will in these cases receive the textual
        // portion of the HTTP status)
        this.constructAjaxErrorMsg = function(jqXHR, textStatus, errorThrown) {
            // This is an error message from server. Hopefully, it is translated.
            if (jqXHR.responseText && jqXHR.responseText.length > 0) {
                return jqXHR.responseText;
            }

            // This is the fallback: Display a technical HTTP error message, e.g.
            // Bad Request (400).
            // Most likely, it is not translated.

            // assume that jqXHR.status === 0 means connection lost
            if (jqXHR.status === 0) {
                return "Connection lost";
            }
            var errMsg;
            if (textStatus === "error") {
                errMsg = errorThrown;
            } else {
                errMsg = textStatus;
            }
            return errMsg + " (" + jqXHR.status + "). ";
        };

        /*
         * checks whether the specified value is a valid hex value
         */
        this.isHex = function(sValue) {
            var result = true;

            if (sValue && (sValue.length % 2) === 0) {
                for (var i = 0; i < sValue.length; i++) {
                    if ("0123456789ABCDEF".indexOf(sValue.charAt(i)) === -1) {
                        result = false;
                        break;
                    }
                }
            } else {
                result = false;
            }

            return result;
        };

        /*
         * converts the given string to its hex representation
         */
        this.toHex = function(sValue) {
            var sHexString = "";

            if (sValue) {
                for (var i = 0; i < sValue.length; i++) {
                    sHexString += sValue.charCodeAt(i).toString(16);
                }
            }

            return sHexString.toUpperCase();
        };

        /*
         * Convert a base 64 encoded number to a string containing a hexadecimal representation
         */
        this.base64ToHex = function(base64Str) {
            if (!base64Str) {
                return "";
            }

            var base64StrLength = base64Str.length;
            var paddingIndex, bits1, bits2, i, byte;
            var map = this._map;

            // Ignore padding
            var paddingChar = map.charAt(64);
            if (paddingChar) {
                paddingIndex = base64Str.indexOf(paddingChar);
                if (paddingIndex !== -1) {
                    base64StrLength = paddingIndex;
                }
            }

            // convert from base64
            var aWords = [];
            var nBytes = 0;
            for (i = 0; i < base64StrLength; i++) {
                if (i % 4) {
                    bits1 = map.indexOf(base64Str.charAt(i - 1)) << ((i % 4) * 2);
                    bits2 = map.indexOf(base64Str.charAt(i)) >>> (6 - (i % 4) * 2);
                    aWords[nBytes >>> 2] |= (bits1 | bits2) << (24 - (nBytes % 4) * 8);
                    nBytes++;
                }
            }

            // convert to hex
            var result = "";
            for (i = 0; i < nBytes; i++) {
                byte = (aWords[i >>> 2] >>> (24 - (i % 4) * 8)) & 0xff;
                result += (byte >>> 4).toString(16);
                result += (byte & 0x0f).toString(16);
            }

            return result.toUpperCase();
        };

        /*
         * Convert a hexadecimal representation into a base 64 encoded value
         */
        this.hexToBase64 = function(hexStr) {
            var i = 0;

            hexStr = hexStr.toUpperCase();

            var binary = [];
            for (i = 0; i < hexStr.length / 2; i++) {
                var h = hexStr.substr(i * 2, 2);
                binary[i] = parseInt(h, 16);
            }

            var base64Value = [];
            i = 0;
            var j = 0;
            var hexCharArray = new Array(3);
            var base64CharArray = new Array(4);

            for (var pos = 0; pos < binary.length; pos++) {
                hexCharArray[i++] = binary[pos];
                if (i === 3) {
                    base64CharArray[0] = (hexCharArray[0] & 0xfc) >> 2;
                    base64CharArray[1] = ((hexCharArray[0] & 0x03) << 4) + ((hexCharArray[1] & 0xf0) >> 4);
                    base64CharArray[2] = ((hexCharArray[1] & 0x0f) << 2) + ((hexCharArray[2] & 0xc0) >> 6);
                    base64CharArray[3] = hexCharArray[2] & 0x3f;

                    for (i = 0; (i < 4); i++) {
                        base64Value += this._map.charAt(base64CharArray[i]);
                    }
                    i = 0;
                }
            }

            if (i) {
                for (j = i; j < 3; j++) {
                    hexCharArray[j] = 0;
                }

                base64CharArray[0] = (hexCharArray[0] & 0xfc) >> 2;
                base64CharArray[1] = ((hexCharArray[0] & 0x03) << 4) + ((hexCharArray[1] & 0xf0) >> 4);
                base64CharArray[2] = ((hexCharArray[1] & 0x0f) << 2) + ((hexCharArray[2] & 0xc0) >> 6);
                base64CharArray[3] = hexCharArray[2] & 0x3f;

                for (j = 0; j < i + 1; j++) {
                    base64Value += this._map.charAt(base64CharArray[j]);
                }
                while ((i++ < 3)) {
                    base64Value += '=';
                }

            }

            return base64Value;
        };

        /*
         * USE THIS FUNCTION ONLY IN SPECIAL CASES because applicationContext Model of EtdComponent provides the session user.
         * 
         * Fetch the session user from Hana. The error message is displayed in a mobile error popup.
         */
        this.getSessionUser = function() {
            var that = this;
            var user = "";
            $.ajax({
                url : "/sap/secmon/services/HANASessionUser.xsjs",
                dataType : "json",
                async : false,
                type : "GET",
                success : function(response) {
                    user = response.username;
                },
                error : function(xhr, textStatus, errorThrown) {
                    jQuery.sap.require("sap.m.MessageBox");
                    sap.m.MessageBox.alert(that.constructAjaxErrorMsg(xhr, textStatus, errorThrown), {
                        title : TextUtils.getText("/sap/secmon/ui/CommonUIText.hdbtextbundle", "Error_TIT")
                    });
                }
            });
            if (user.length === 0) {
                jQuery.sap.require("sap.m.MessageBox");
                sap.m.MessageBox.alert("Fetching session user failed.", {
                    title : TextUtils.getText("/sap/secmon/ui/CommonUIText.hdbtextbundle", "Error_TIT")
                });
            }
            return user;
        };

        /*
         * Fetch the CSRF token using a synchronous ajax request. Applications can use the token in their ajax requests as follows:
         * 
         * beforeSend : function(xhr) { xhr.setRequestHeader("X-CSRF-Token", csrfToken); }
         * 
         */
        this.getXCSRFToken = function() {
            var that = this;
            var token = "";
            $.ajax({
                url : "/sap/secmon/services/ui/commons/dummyService.xsjs",
                async : false,
                type : "GET",
                beforeSend : function(xhr) {
                    xhr.setRequestHeader("X-CSRF-Token", "Fetch");
                },
                success : function(data, textStatus, XMLHttpRequest) {
                    token = XMLHttpRequest.getResponseHeader('X-CSRF-Token');
                },
                error : function(xhr, textStatus, errorThrown) {
                    alert(that.constructAjaxErrorMsg(xhr, textStatus, errorThrown));
                }
            });
            if (!token || token.length === 0) {
                jQuery.sap.require("sap.m.MessageBox");
                sap.m.MessageBox.alert("Fetching CSRF token failed.", {
                    title : TextUtils.getText("/sap/secmon/ui/CommonUIText.hdbtextbundle", "Error_TIT")
                });
            }
            return token;
        };

        /*
         * Fetch the CSRF token using an asynchronous ajax request. Applications can use the token in their ajax requests as follows:
         * 
         * beforeSend : function(xhr) { xhr.setRequestHeader("X-CSRF-Token", csrfToken); }
         * 
         */
        this.getXCSRFTokenAsync = function() {
            var that = this;
            var token = "";
            var oDeferred = $.Deferred();
            $.ajax({
                url : "/sap/secmon/services/ui/commons/dummyService.xsjs",
                async : true,
                type : "GET",
                beforeSend : function(xhr) {
                    xhr.setRequestHeader("X-CSRF-Token", "Fetch");
                },
                success : function(data, textStatus, XMLHttpRequest) {
                    token = XMLHttpRequest.getResponseHeader('X-CSRF-Token');
                    if (!token || token.length === 0) {
                        jQuery.sap.require("sap.m.MessageBox");
                        sap.m.MessageBox.alert("Fetching CSRF token failed.", {
                            title : TextUtils.getText("/sap/secmon/ui/CommonUIText.hdbtextbundle", "Error_TIT")
                        });
                        oDeferred.reject();
                    }
                    oDeferred.resolve(token);
                },
                error : function(xhr, textStatus, errorThrown) {
                    alert(that.constructAjaxErrorMsg(xhr, textStatus, errorThrown));
                    oDeferred.reject();
                }
            });
            return oDeferred.promise();
        };

        /*-
         * Compare two objects.
         * Objects o1, o2 are treated as equal if 1, 2, or 3 is true:
         * 1. o1 === o2
         * 2. o1 and o2 are Date objects with the same time 
         * 3. o1, o2 have the same members
         *      Literal members are identical (===) and object members are equal (recursion)
         * The function can be called in a static way (without "this"-binding).
         */
        this.deepEqual = function(o1, o2) {

            function compare(o1, o2) {
                if (o1 === o2) {
                    return true;
                }
                if (o1 instanceof Date) {
                    if (!(o2 instanceof Date)) {
                        return false;
                    }
                    if (o1.getTime() !== o2.getTime()) {
                        return false;
                    }
                    return true;
                }
                var o1Properties = Object.getOwnPropertyNames(o1);
                var o2Properties = Object.getOwnPropertyNames(o2);
                if (o1Properties.length !== o2Properties.length) {
                    return false;
                }
                for (var i = 0; i < o1Properties.length; i++) {
                    var propertyName = o1Properties[i];
                    if (typeof o1[propertyName] === "object") {
                        if (typeof o2[propertyName] !== "object") {
                            return false;
                        }
                        if (!compare(o1[propertyName], o2[propertyName])) {
                            return false;
                        }
                    } else if (o1[propertyName] !== o2[propertyName]) {
                        return false;
                    }
                }
                return true;
            }

            return compare(o1, o2);
        };

        /** Clone an object, make a shallow copy */
        this.clone = function(obj) {
            if (null === obj || "object" !== typeof obj) {
                return obj;
            }
            var copy = obj.constructor();
            for ( var attr in obj) {
                if (obj.hasOwnProperty(attr)) {
                    copy[attr] = obj[attr];
                }
            }
            return copy;
        };

        /**
         * Clone an object, make a deep copy. Caution: This function ignores attributes with undefined value. But null attributes are copied. Do not use this function if you want to call function
         * "deepEqual" later on.
         */
        this.cloneObject = function(oObject) {
            // Caution: Documentation of jQuery.extend is incorrect:
            // It states that it would ignore null and undefined attributes.
            // Instead, only undefined attributes are ignored.
            return jQuery.extend(true, {}, oObject);
        };

        /**
         * Clone an object, make a deep copy. This function clones an object, including attributes with undefined value. This function is safe to use in conjunction with function "deepEqual".
         */
        this.cloneObjectIncludingUndefinedAttributes = function(oObject) {
            var clone = jQuery.extend(true, {}, oObject);
            for ( var attr in oObject) {
                if (oObject[attr] === undefined) {
                    clone[attr] = undefined;
                }
            }
            return clone;
        };

        /*-
         * Retrieves the distinct values of a table column
         * @param aObjects contains a table (objects with same properties)
         * @param sColumnName contains the name of the column with distinct values
         * @param sAdditionalInfoColumnName contains the name of a column with additional info.
         * The values of the additional values are not necessarily unique. Example:
         * The main column is "NameSpace", the additional info column is "NamespaceId".
         * Example: 
         * aObjects = [ {
         *       NameSpace : null, NameSpaceId: "1111"
         *   }, {
         *       NameSpace : "http://sap", NameSpaceId: "2222"
         *   }, {
         *       NameSpace : "http://sap.com", NameSpaceId: "3333"
         *   }, {
         *       NameSpace : "http://sap.com", NameSpaceId: "3333"
         *   } ];
         *   
         *   The function returns a table with one column containing the distinct values. Null and undefined
         *   are ignored.
         *   
         *   Result: [{NameSpace:"http://sap", NameSpaceId: "2222"}, {NameSpace:"http://sap.com", NamespaceId: "3333"}]
         * 
         */
        this.distinctValuesOfColumn = function(aObjects, sColumnName, sAdditionalInfoColumnName) {
            // Store distinct values in the valuesmap:
            // Key: value of main column
            // Value: value of additional info column (if exists)
            var valuesMap = {};
            aObjects.forEach(function(oResult) {
                var value = oResult[sColumnName];
                var addValue = (sAdditionalInfoColumnName && sAdditionalInfoColumnName.length > 0) ? oResult[sAdditionalInfoColumnName] : null;
                if (value !== null && value !== undefined) {
                    if (!(value in valuesMap)) {
                        valuesMap[value] = addValue;
                    }
                }
            });

            var aResult = [];
            for ( var prop in valuesMap) {
                if (valuesMap.hasOwnProperty(prop)) {
                    var obj = {};
                    obj[sColumnName] = prop;
                    if (sAdditionalInfoColumnName && sAdditionalInfoColumnName.length > 0) {
                        obj[sAdditionalInfoColumnName] = valuesMap[prop];
                    }
                    aResult.push(obj);
                }
            }
            return aResult;
        };

        /*-
         *  Load the distinct values of a column asynchronously.
         *  sServiceUrl contains an OData service url.
         *  @param sEntityName specifies the name of the entity.
         *  @param sColumnName contains the name of the column with distinct values.
         *  @param sAdditionalInfoColumnName optional additional column with additional info.
         *  Example: The main column is "nameSpace", the additional column is "nameSpaceId".
         *  The values of the main column are guaranteed to be unique.
         *  The value sof the additinal info column are not guranteed to be unique.
         *  The returned promise is resolved with the loaded data. 
         *  Example: data = [{col1: "1"}, {col1: "2"}]
         *  or: [{col1: "1", col2: "A"}, {col1: "2", col2: "B"}]
         */
        this.loadDistinctValuesOfColumn = function(sServiceUrl, sEntityName, sColumnName, sAdditionalInfoColumnName) {
            var oDeferred = $.Deferred();
            var sAddColumn = (sAdditionalInfoColumnName && sAdditionalInfoColumnName.length > 0) ? "," + sAdditionalInfoColumnName : "";
            var sUrl = sServiceUrl + "/" + sEntityName + "?$select=" + sColumnName + sAddColumn + "&$format=json";
            var that = this;

            $.ajax({
                url : sUrl,
                type : "GET",
                success : function(data, textStatus, XMLHttpRequest) {
                    var oResult = that.distinctValuesOfColumn(data.d.results, sColumnName, sAdditionalInfoColumnName);
                    oDeferred.resolve(oResult);
                },
                error : function(xhr, textStatus, errorThrown) {
                    alert(that.constructAjaxErrorMsg(xhr, textStatus, errorThrown));
                    oDeferred.reject();
                }
            });
            return oDeferred.promise();
        };
        this.getVersion = function() {
            return "2.2.0";
        };
    };

    return sap.secmon.ui.commons.CommonFunctions;
});
