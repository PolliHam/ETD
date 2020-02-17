var ADependencies = [ "sap/secmon/ui/commons/CommonFunctions", "sap/ui/model/odata/CountMode" ];

sap.ui.define(ADependencies, function(CommonFunctions, CountMode) {
    "use strict";

    sap.secmon.ui.commons.EnumService =
            function() {
                if (sap.secmon.ui.commons.EnumService.prototype.singletoninstance) {
                    return sap.secmon.ui.commons.EnumService.prototype.singletoninstance;
                }
                sap.secmon.ui.commons.EnumService.prototype.singletoninstance = this;
                var sLocale = sap.ui.getCore().getConfiguration().getLanguage();
                this.oTextBundle = jQuery.sap.resources({
                    url : '/sap/secmon/texts/EnumTextBundle.hdbtextbundle',
                    locale : sLocale
                });
                var oCommons = new CommonFunctions();
                var ENUM_SERVICE_URL = "/sap/secmon/services/genericEnum.xsodata/Enum?$format=json";
                var ENUM_ODATA_URL = "/sap/secmon/services/genericEnum.xsodata";

                var oModel = new sap.ui.model.odata.ODataModel(ENUM_ODATA_URL, {
                    json : true,
                    defaultCountMode : CountMode.Inline
                });
                oModel.attachRequestFailed(oCommons.handleRequestFailed);

                /*-
                 * This functions loads the enums for a given package root from the back end
                 * and copies them into a JSON object. 
                 *
                 *   var oData = oEnumService.loadEnums("sap.secmon.services.ui.m.invest");
                 *   
                 *   The content of oData looks as follows:
                 *   
                 *    {
                 *    "sap.secmon.services.ui.m.invest": {  // Package
                 *        "Investigation": {                // Object
                 *            "Severity": {                 // Attribute
                 *                "enumValues": [
                 *                    {
                 *                        "Key": "LOW",
                 *                        "Value": "Low"
                 *                    },
                 *                    {
                 *                        "Key": "MEDIUM",
                 *                        "Value": "Medium"
                 *                    },
                 *                ],
                 *                "keyValueMap": {
                 *                    "HIGH": "High",
                 *                    "LOW": "Low",
                 *                    "MEDIUM": "Medium",
                 *                    "VERY_HIGH": "Very High"
                 *                }
                 *            },
                 *            "Status": {
                 *                "enumValues": [
                 *                ...
                 *                ],
                 *                "keyValueMap": {
                 *                ...
                 *                }
                 *            }
                 *        }
                 *    }
                 *    }
                 * 
                 * The JSON object can afterwards be used to create an enums model:
                 * 
                 *   oModel = new sap.ui.model.json.JSONModel();
                 *   oModel.setData(oData);
                 *   this.setModel(oModel, "enumsModel");
                 *
                 * The enums model can be used for aggregation binding in the following way:
                 *   
                 *   items="{enumsModel>/sap.secmon.services.ui.m.invest/Investigation/Severity/enumValues}"
                 * 
                 *  Each enum also offers a key value map contained in member keyValueMap.
                 * 
                 */
                this.loadEnums = function(sPackageRoot) {
                    var url = ENUM_SERVICE_URL + "&$filter=startswith(Package,'" + sPackageRoot + "')";
                    var oEnums = null;
                    $.ajax({
                        url : encodeURI(url),
                        async : false,
                        type : "GET",
                        success : function(data, textStatus, XMLHttpRequest) {
                            oEnums = data;
                        },
                        error : function(xhr, textStatus, errorThrown) {
                            alert(oCommons.constructAjaxErrorMsg(xhr, textStatus, errorThrown));
                        }
                    });
                    if (!oEnums) {
                        return null;
                    }
                    return this.buildEnumsObject(oEnums.d.results);
                };

                /*
                 * sPackageRoots can contain multiple package roots separated by ,
                 * 
                 */
                this.loadEnumsAsync = function(sPackageRoots) {
                    var aPackageRoots = sPackageRoots.split(',');
                    var sPackageRoot = aPackageRoots[0];

                    function mkFilterComponent(sPackageRoot) {
                        return "startswith(Package,'" + sPackageRoot + "')";
                    }

                    var oDeferred = $.Deferred();
                    var url = ENUM_SERVICE_URL + "&$filter=" + mkFilterComponent(sPackageRoot);
                    for (var i = 1; i < aPackageRoots.length; i++) {
                        url = url + " or " + mkFilterComponent(aPackageRoots[i]);
                    }
                    var that = this;
                    $.ajax({
                        url : encodeURI(url),
                        async : true,
                        type : "GET",
                        success : function(data, textStatus, XMLHttpRequest) {
                            var oResult = that.buildEnumsObject(data.d.results);
                            oDeferred.resolve(oResult);
                        },
                        error : function(xhr, textStatus, errorThrown) {
                            oDeferred.reject();
                            alert(oCommons.constructAjaxErrorMsg(xhr, textStatus, errorThrown));
                        }
                    });
                    return oDeferred.promise();
                };

                /*-
                 * This function can be used to retrieve the enum value for a given key.
                 * Example: retrieve value in a formatter:
                 * 
                 *    severityFormatter : function(severity) {
                 *        var enumsModel = this.getModel("enumsModel");
                 *        return sap.secmon.ui.m.invest.util.Formatter.oEnumService.getEnumValue(enumsModel, "/sap.secmon.services.ui.m.invest/Investigation/Severity/", severity);
                 *    }
                 */
                this.getEnumValue = function(oEnumsModel, enumPath, key) {
                    var oKeyValueMap = oEnumsModel.getProperty(enumPath + "keyValueMap");
                    if (!oKeyValueMap) {
                        return key;
                    }
                    var oResult = oKeyValueMap[key];
                    if (oResult) {
                        return oResult;
                    } else {
                        return key;
                    }
                };

                /**
                 * build a tree object from a flat list of enum objects.
                 * 
                 */
                this.buildEnumsObject = function(aFlatEnums) {
                    var oEnums = {};
                    var oTextBundle = this.oTextBundle;
                    aFlatEnums.forEach(function(oFlatEnum) {
                        var sPackage = oFlatEnum.Package;
                        if (!oEnums[sPackage]) {
                            oEnums[sPackage] = {};
                        }
                        var oPackage = oEnums[sPackage];
                        var sObject = oFlatEnum.Object;
                        if (!oPackage[sObject]) {
                            oPackage[sObject] = {};
                        }
                        var sAttribute = oFlatEnum.Attribute;
                        if (!oPackage[sObject][sAttribute]) {
                            oPackage[sObject][sAttribute] = {};
                        }
                        var oEnum = oPackage[sObject][sAttribute];
                        if (!oEnum.enumValues) {
                            oEnum.enumValues = [];
                        }
                        if (!oEnum.keyValueMap) {
                            oEnum.keyValueMap = {};
                        }
                        var key = oFlatEnum.Key;
                        var value = oFlatEnum.Value;
                        var index = oFlatEnum.SortOrder;
                        var textKey = oFlatEnum.TextKey;
                        var text = oTextBundle.getText(textKey) || value;
                        oEnum.keyValueMap[key] = text;
                        // insert enum value according to sort order
                        oEnum.enumValues[index - 1] = {
                            Key : key,
                            Value : text,
                            SortOrder : index,
                            // Enums can have customer extensions
                            editable : oFlatEnum.editable
                        };
                    });
                    return oEnums;
                };

                /**
                 * look at the enum hierarchy. If the individual enum values have flags "changed", "isNew", or "deleted" set to true, then add corresponding POST, PUT, and DELETE requests into a batch
                 * request and send it to the OData service.
                 * 
                 * @param oEnumTree
                 *            the enum in the tree format
                 * @param fnCallbackOnSuccess
                 *            callback in case all changes have been commited successfully
                 * @param fnCallbackOnError
                 *            callback in case at least one change failed
                 */
                this.saveEnums =
                        function(oEnumTree, fnCallbackOnSuccess, fnCallbackOnError) {
                            var aFlatEnums = this.buildFlatEnums(oEnumTree);

                            var aBatchChanges = [];
                            aFlatEnums.forEach(function(oEnum) {
                                var enumValuePath =
                                        (oEnum.isNew !== true) ? "/Enum(Package='" + oEnum.Package + "',Object='" + oEnum.Object + "',Attribute='" + oEnum.Attribute + "',Key='" +
                                                encodeURIComponent(oEnum.Key) + "')" : "/Enum";
                                var oValue = {
                                    Package : oEnum.Package,
                                    Object : oEnum.Object,
                                    Attribute : oEnum.Attribute,
                                    Key : oEnum.Key,
                                    Language : oEnum.Language,
                                    SortOrder : oEnum.SortOrder,
                                    Value : oEnum.Value,
                                    editable : oEnum.editable
                                };
                                if (oEnum.deleted === true) {
                                    aBatchChanges.push(oModel.createBatchOperation(enumValuePath, "DELETE", oValue));
                                } else if (oEnum.isNew === true) {
                                    aBatchChanges.push(oModel.createBatchOperation(enumValuePath, "POST", oValue));
                                } else if (oEnum.changed === true) {
                                    aBatchChanges.push(oModel.createBatchOperation(enumValuePath, "PUT", oValue));
                                }
                            });
                            this.sendODataBatchRequest(aBatchChanges, fnCallbackOnSuccess, fnCallbackOnError);
                        };

                /**
                 * build a flat list of enum objects from a hierarchy of enum objects. Note: The enum objects may have fields "isNew", "deleted", or "changed". These fields are preserved and passed
                 * over to the flat list of enum objects.
                 */
                this.buildFlatEnums = function(oEnumTree) {
                    var enumConverter = function(flatList, packageString, objectString, attribute) {
                        var aFlatList = flatList, sPackage = packageString, sObject = objectString, sAttribute = attribute;
                        return function(oEnumValue) {

                            aFlatList.push({
                                Package : sPackage,
                                Object : sObject,
                                Attribute : sAttribute,
                                Key : oEnumValue.Key,
                                Value : oEnumValue.Value,
                                SortOrder : oEnumValue.SortOrder,
                                Language : "",
                                TextKey : null,
                                editable : oEnumValue.editable,
                                isNew : oEnumValue.isNew,
                                changed : oEnumValue.changed,
                                deleted : oEnumValue.deleted
                            });
                        };
                    };
                    var aFlatList = [];
                    for ( var sPackage in oEnumTree) {
                        var oPackage = oEnumTree[sPackage];
                        for ( var sObject in oPackage) {
                            var oObject = oPackage[sObject];
                            for ( var sAttribute in oObject) {
                                var oAttribute = oObject[sAttribute];
                                oAttribute.enumValues.forEach(enumConverter(aFlatList, sPackage, sObject, sAttribute));
                            }
                        }
                    }
                    return aFlatList;
                };

                /**
                 * send the batch changes to the enum OData service
                 */
                this.sendODataBatchRequest = function(aBatchChanges, fnCallbackOnSuccess, fnCallbackOnError) {
                    sap.ui.core.BusyIndicator.show();
                    oModel.setUseBatch(true);
                    oModel.addBatchChangeOperations(aBatchChanges);
                    oModel.submitBatch(function(data) {
                        // on a batch request, returned data holds an array
                        var dirty, errorMsg;
                        data.__batchResponses.forEach(function(responseObject) {
                            if (responseObject.response && responseObject.response.statusCode >= 300) {
                                dirty = true;
                                errorMsg = responseObject.response;
                            }
                            if (responseObject.__changeResponses) {
                                responseObject.__changeResponses.forEach(function(changeResponse) {
                                    if (changeResponse.statusCode >= 300) {
                                        dirty = true;
                                        errorMsg = responseObject.response;
                                    }
                                });
                            }
                        });
                        sap.ui.core.BusyIndicator.hide();
                        if (dirty) {
                            if (fnCallbackOnError) {
                                fnCallbackOnError(errorMsg);
                            }
                        } else {
                            if (fnCallbackOnSuccess) {
                                fnCallbackOnSuccess();
                            }
                        }
                    }, function(error) {
                        // unused in batch request
                        sap.ui.core.BusyIndicator.hide();
                        if (fnCallbackOnError) {
                            fnCallbackOnError(error);
                        }
                    });
                    oModel.setUseBatch(false);
                };
            };

    return sap.secmon.ui.commons.EnumService;

});
