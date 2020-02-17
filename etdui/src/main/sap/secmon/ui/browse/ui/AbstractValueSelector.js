/* globals oTextBundle */
$.sap.declare("sap.secmon.ui.browse.AbstractValueSelector");

$.sap.require("sap.secmon.ui.browse.utils");
$.sap.require("sap.secmon.ui.browse.Constants");

/**
 * Abstract custom control to provide: 1. Common methods for all types of value selectors 2. A factory method to create concrete selector dynamically
 * 
 * @see: GeneralFilterCard.js, TimeRange.js and DependsOnSubsetCard.js
 * @TODO: has to provide the common layout
 * 
 */
sap.ui.core.Control.extend("sap.secmon.ui.browse.AbstractValueSelector", {

    metadata : {
        properties : {
        // values : {
        // type : "string[]"
        // }

        },
        aggregations : {
            layout : {
                // type : "sap.ui.layout.Grid",
                type : "sap.ui.commons.layout.MatrixLayout",
                multiple : false,
            },
        },

        events : {
            validationOK : {},
            validateValues : {},
        }
    },

    // Public methods
    getDataByKey : function(sKey, sContext, oModel) {
        var oFound;
        $.each(oModel.getData()[sContext], function(idx, oObj) {
            if (oObj.key === sKey) {
                oFound = oObj;
                return false;
            }
        });
        return oFound;
    },

    createSelector : function(oSelectedFilterData, oMatrixLayout) {

        var that = this;
        var oCurrentSelector;
        var oFilterCard = oMatrixLayout.getParent();

        // Dependency Card
        if (oSelectedFilterData.isFieldRef === 1) {
            oCurrentSelector =
                    new sap.secmon.ui.browse.DependsOnSubsetCard({
                        validationOK : function(oEvent) {
                            oFilterCard.fireValidationOK();
                        },
                        validateValues : function(oEvent) {
                            var oSelectedFilterData = oEvent.getSource().getModel().getData();

                            if ($.isEmptyObject(oSelectedFilterData.valueRange.searchTerms) || $.isEmptyObject(oSelectedFilterData.valueRange.searchTermRefKeys)) {
                                sap.ui.commons.MessageBox.show(oTextBundle.getText("BU_MSG_CrFilterNoValRef"), sap.ui.commons.MessageBox.Icon.ERROR, oTextBundle.getText("BU_TIT_CrFilter"),
                                        sap.ui.commons.MessageBox.Action.OK);
                            } else {
                                var oReferencedFieldModel = sap.ui.getCore().getModel('ReferencedFieldModel');
                                var oRefFieldMetadata = that.getDataByKey(oSelectedFilterData.valueRange.searchTermRefKeys[0], "data", oReferencedFieldModel);
                                if (oSelectedFilterData.dataType === oRefFieldMetadata.dataType) {
                                    oEvent.getSource().fireValidationOK();
                                } else {
                                    sap.ui.commons.MessageBox.show(oTextBundle.getText("BU_MSG_CrFilterRefIvalid"), sap.ui.commons.MessageBox.Icon.ERROR, oTextBundle.getText("BU_TIT_CrFilter"),
                                            sap.ui.commons.MessageBox.Action.OK);
                                }
                            }
                        }
                    });
            // allowed operators
            oSelectedFilterData.filterOperators = [ "=", ">", ">=", "<", "<=" ];
            sap.ui.getCore().getModel('SelectedFilterModel').setProperty("/filterOperators", oSelectedFilterData.filterOperators);
            oMatrixLayout.addRow(new sap.ui.commons.layout.MatrixLayoutRow({
                cells : [ new sap.ui.commons.layout.MatrixLayoutCell({
                    colSpan : 3,
                    content : oCurrentSelector
                }) ]
            }));
            // TimeRange Card
        } else if (oSelectedFilterData.dataType === sap.secmon.ui.browse.Constants.C_DATA_TYPE.TIMESTAMP) {
            
            var sRelativeValue, sFromTS, sToTS;
            var sTRType = "Relative";
            if (oSelectedFilterData.valueRange.operator === "" || oSelectedFilterData.valueRange.operator === "=") {
                sTRType = "Relative";
                oSelectedFilterData.valueRange.operator = "=";
            } else if (oSelectedFilterData.valueRange.operator === "BETWEEN") {
                sTRType = "Absolute";
            }

            // mode = NEW
            if (oSelectedFilterData.valueRange.searchTerms.length === 0) {

                sRelativeValue = sap.secmon.ui.browse.Constants.C_TIMERANGE.LAST_HOUR;
                sToTS = new Date();
                sFromTS = new Date(sToTS.getTime() - 3600 * 1000);

                sToTS = sap.secmon.ui.browse.utils.getDateAsYyyymmddUTC(sToTS) + 'T' + sap.secmon.ui.browse.utils.getTimeAsHHMMSSUTC(sToTS) + 'Z';
                sFromTS = sap.secmon.ui.browse.utils.getDateAsYyyymmddUTC(sFromTS) + 'T' + sap.secmon.ui.browse.utils.getTimeAsHHMMSSUTC(sFromTS) + 'Z';

                if (sTRType === "Relative") {
                    oSelectedFilterData.valueRange.searchTerms.push(sRelativeValue);
                } else if (sTRType === "Absolute") {
                    oSelectedFilterData.valueRange.searchTerms.push(sFromTS);
                    oSelectedFilterData.valueRange.searchTerms.push(sToTS);
                }
            } else { // mode = EDIT

                if (sTRType === "Relative") {
                    sRelativeValue = oSelectedFilterData.valueRange.searchTerms[0];
                } else if (sTRType === "Absolute") {
                    sFromTS = oSelectedFilterData.valueRange.searchTerms[0];
                    sToTS = oSelectedFilterData.valueRange.searchTerms[1];
                }
            }

            oCurrentSelector =
                    new sap.secmon.ui.browse.TimeRangeCard({
                        type : sTRType,
                        value : {
                            showUTC : that.getModel('applicationContext').getData().UTC,
                            relativeValue : sRelativeValue,
                            absoluteValue : {
                                from : sFromTS,
                                to : sToTS
                            }
                        },
                        validationOK : function(oEvent) {
                            oFilterCard.fireValidationOK();
                        },
                        validateValues : function(oEvent) {
                            var src = oEvent.getSource();

                            var oTimeRange = src._timeRange;
                            var sType = oTimeRange.getType();
                            var oVal = oTimeRange.getValue();

                            if (sType === sap.secmon.ui.browse.Constants.C_TIMERANGE.TYPE_RELATIVE) {
                                if (oVal.relativeValue) {
                                    // we should not overwrite the whole value
                                    src.getModel().setProperty("/valueRange/operator", "=");
                                    src.getModel().setProperty("/valueRange/searchTerms", [ oVal.relativeValue ]);

                                    src.fireValidationOK();
                                } else {
                                    sap.ui.commons.MessageBox.show(oTextBundle.getText("BU_MSG_CrFilterNoRelTS"), sap.ui.commons.MessageBox.Icon.ERROR, oTextBundle.getText("BU_TIT_CrFilter"),
                                            sap.ui.commons.MessageBox.Action.OK);
                                }
                            } else if (sType === sap.secmon.ui.browse.Constants.C_TIMERANGE.TYPE_ABSOLUTE) {
                                if (oVal.absoluteValue.from > oVal.absoluteValue.to) {
                                    sap.ui.commons.MessageBox.show(oTextBundle.getText("BU_MSG_CrFilterFromGRTo"), sap.ui.commons.MessageBox.Icon.ERROR, oTextBundle.getText("BU_TIT_CrFilter"),
                                            sap.ui.commons.MessageBox.Action.OK);
                                } else {
                                    // we should not overwrite the whole value
                                    src.getModel().setProperty("/valueRange/operator", "BETWEEN");
                                    src.getModel().setProperty("/valueRange/searchTerms", [ oVal.absoluteValue.from, oVal.absoluteValue.to ]);

                                    src.fireValidationOK();
                                }
                            }
                        },
                    });

            oMatrixLayout.addRow(new sap.ui.commons.layout.MatrixLayoutRow({
                cells : [ new sap.ui.commons.layout.MatrixLayoutCell({
                    colSpan : 3,
                    content : oCurrentSelector
                }) ]
            }));

            // General Value Selector Card
        } else {
            oCurrentSelector =
                    new sap.secmon.ui.browse.GeneralFilterCard({
                        validationOK : function(oEvent) {
                            oFilterCard.fireValidationOK();
                        },
                        validateValues : function(oEvent) {
                            var oSelectedFilterData = oEvent.getSource().getModel().getData();
                            if ($.isEmptyObject(oSelectedFilterData.valueRange.searchTerms)) {
                                sap.ui.commons.MessageBox.show(oTextBundle.getText("BU_MSG_CrFilterNoVal"), sap.ui.commons.MessageBox.Icon.ERROR, oTextBundle.getText("BU_TIT_CrFilter"),
                                        sap.ui.commons.MessageBox.Action.OK);
                            } else {
                                var bValid = true;
                                if (sap.secmon.ui.browse.utils.isTypeNumber(oSelectedFilterData.dataType)) {
                                    for (var i = 0, maxLen = oSelectedFilterData.valueRange.searchTerms.length; i < maxLen; i++) {
                                        if (isNaN(oSelectedFilterData.valueRange.searchTerms[i])) {
                                            bValid = false;
                                            break;
                                        } else {
                                            oSelectedFilterData.valueRange.searchTerms[i] = parseInt(oSelectedFilterData.valueRange.searchTerms[i]);
                                        }
                                    }
                                }

                                if (bValid) {
                                    this.fireValidationOK();
                                } else {
                                    sap.ui.commons.MessageBox.show(oTextBundle.getText("BU_MSG_CrFilterValIvalid"), sap.ui.commons.MessageBox.Icon.ERROR, oTextBundle.getText("BU_TIT_CrFilter"),
                                            sap.ui.commons.MessageBox.Action.OK);
                                }
                            }
                        },
                    });
            oMatrixLayout.addRow(new sap.ui.commons.layout.MatrixLayoutRow({
                cells : [ new sap.ui.commons.layout.MatrixLayoutCell({
                    colSpan : 3,
                    content : oCurrentSelector
                }) ]
            }));
        }

        return oCurrentSelector;
    },

    init : function() {

        var oModel = sap.ui.getCore().getModel('SelectedFilterModel');
        if (oModel !== undefined) {
            if (oModel.getProperty("/valueRange") === undefined) {
                var oData = oModel.getData();
                oData.valueRange = {
                    operator : "="
                };
                oModel.setData(oData);
            }
            this.setModel(oModel);
        }

        this.setAggregation("layout", new sap.ui.commons.layout.MatrixLayout({
            columns : 3
        }));

        // this.setAggregation("layout", new sap.ui.layout.Grid({
        // defaultSpan : "XL3 L3 M6 S12"
        // }));

    },

    exit : function() {

    },

    onBeforeRendering : function() {
    },

    onAfterRendering : function() {
    },

    renderer : function(oRm, oControl) {

        oRm.write("<div");
        oRm.writeControlData(oControl); // writes the Control ID and enables
        oRm.writeClasses(); // there is no class to write, but this enables
        oRm.write(">");
        oRm.renderControl(oControl.layout);
        oRm.write("</div>"); // end of the complete Control
    }

});

$.sap.require("sap.secmon.ui.browse.GeneralFilterCard");
$.sap.require("sap.secmon.ui.browse.DependsOnSubsetCard");
$.sap.require("sap.secmon.ui.browse.TimeRangeCard");
