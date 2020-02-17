/**
 * This Controller aims to provide common used Controller functions in Mobile Applications.
 */
jQuery.sap.includeStyleSheet("/sap/secmon/ui/m/css/ViewSettingsStyle.css");

var ADependencies = [ "sap/secmon/ui/commons/Formatter", "sap/ui/core/mvc/Controller" ];

sap.ui.define(ADependencies, function(Formatter, Controller) {
    "use strict";
    return Controller.extend("sap.secmon.ui.m.commons.EtdController", {

        NAMESPACES_SERVICE : "/sap/secmon/services/ui/m/namespace/system_namespace.xsodata/SystemNamespace",

        getComponent : function() {
            return sap.ui.getCore().getComponent(sap.ui.core.Component.getOwnerIdFor(this.getView()));
        },

        getRouter : function() {
            return sap.ui.core.UIComponent.getRouterFor(this);
        },

        /**
         * Applies cozy compact to the given view according to touch support of the device.
         */
        applyCozyCompact : function() {
            if (!jQuery.support.touch || (jQuery.support.touch && sap.ui.Device.system.desktop)) {
                this.getView().addStyleClass("sapUiSizeCompact");
            }
        },

        /**
         * Returns the text value with the given text key from the i18n model.
         */
        getText : function(sTextKey) {
            var parameters = Array.prototype.slice.call(arguments, 0), model = this.getComponent().getModel("i18n").getResourceBundle();
            return model.getText.apply(model, parameters);
        },
        /**
         * Returns the text value with the given text key from the i18n common model.
         */
        getCommonText : function(sTextKey) {
            return this.getComponent().getModel("i18nCommon").getProperty(sTextKey);
        },

        /*
         * returns true if timestamps should be displayed in UTC time zone
         */
        UTC : function() {
            return this.getView().getModel("applicationContext").getData().UTC;
        },

        /*-
         * This function replaces place holders in a format string with supplied parameters.
         * Example: i18nText("{0} and {1} are green", "Apples", "Bananas")
         * Result: "Apples and Bananas are green"
         */
        i18nText : function(format) {
            // remember: arguments is no real array
            var aArguments = [ format ].concat(Array.prototype.slice.call(arguments, 1));
            return Formatter.i18nText.apply(this, aArguments);
        },

        enableButtonsIfExactlyOneRowIsSelected : function(oTable, aButtonIds) {
            var fnMatcher = function(aSelectedItems) {
                return aSelectedItems.length === 1;
            };
            return this.enableButtonsIfSelectedRowsMatch(oTable, aButtonIds, fnMatcher);
        },

        enableButtonsIfAtLeastOneRowIsSelected : function(oTable, aButtonIds) {
            var fnMatcher = function(aSelectedItems) {
                return aSelectedItems.length >= 1;
            };
            return this.enableButtonsIfSelectedRowsMatch(oTable, aButtonIds, fnMatcher);
        },

        enableButtonsIfSelectedRowsMatch : function(oTable, aButtonIds, fnMatcher) {
            /*
             * currently this coding only works for mobile table - functions have different names for desktop table
             */
            // disable buttons at the beginning
            aButtonIds.forEach(function(id) {
                this.getView().byId(id).setEnabled(false);
            }, this);

            var that = this;
            var fnEnableButtons = function() {
                var bEnableButtons = fnMatcher(oTable.getSelectedItems());
                aButtonIds.forEach(function(id) {
                    this.getView().byId(id).setEnabled(bEnableButtons);
                }, that);
            };
            oTable.attachSelectionChange(fnEnableButtons);
            oTable.attachUpdateFinished(fnEnableButtons);
        },

        clearTableSelectionAndDisableButtons : function(oTable, aButtonIds) {
            oTable.removeSelections();
            aButtonIds.forEach(function(id) {
                this.getView().byId(id).setEnabled(false);
            }, this);
        },

        /**
         * print content of the view of this controller
         * 
         * @param callBackAfterPrint
         *            a callback which is called after print
         */
        print : function(callBackAfterPrint) {
            // We create a temporary iFrame for printing.
            // Background:
            // We do not want to print the whole page, we only want to print this view.
            // So we need to replace the content of the current window with the selected view content.
            // Problem:
            // We would lose functionality, the event handlers of original window content would be disconnected
            // Solution:
            // We create an iframe and add this view there.

            // create a hidden iFrame which prints itself
            var frame = document.createElement('iframe');

            /* needed to make relative links work in PDF */
            function getBaseURL() {
                return window.location.protocol + "//" + window.location.host + window.location.port + "/";
            }
            function getDocumentStyleAsString() {
                var cssText = "";
                if (document.styleSheets && document.styleSheets.length > 0) {
                    Array.prototype.forEach.call(document.styleSheets, function(styleSheet) {
                        // Only IE has the CSS text in a style sheet. The other browsers have a deeper hierarchy
                        try {
                            if (styleSheet.cssText && styleSheet.cssText.length > 0) {
                                cssText += styleSheet.cssText;
                            } else if (styleSheet.cssRules && styleSheet.cssRules.length > 0) {
                                Array.prototype.forEach.call(styleSheet.cssRules, function(cssRule) {
                                    try {
                                        cssText += cssRule.cssText;
                                    } catch (Error) {
                                    }
                                });
                            }
                        } catch(Error){
                        }
                    });
                }

                return cssText;
            }

            /* event handler called on hidden iFrame */
            function closePrint() {
                try {
                    callBackAfterPrint.call();
                    // IE does not accept "this" here
                    document.body.removeChild(frame);
                } catch (Error) {
                }

            }

            /* event handler called on hidden iFrame */
            var oView = this.getView();
            function setPrint() {
                /*jshint validthis: true */
                // copy content
                var $domView = oView.$()[0], sViewContent = $domView.innerHTML;
                this.contentDocument.body.innerHTML = sViewContent;

                // print
                this.contentWindow.onbeforeunload = closePrint;
                this.contentWindow.onafterprint = closePrint;
                this.contentWindow.focus(); // Required for IE
                this.contentWindow.print();
            }

            document.body.appendChild(frame);

            frame.contentDocument.open();
            frame.contentDocument.write('<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional //EN" "http://www.w3.org/TR/html4/loose.dtd">' + '<html><head><style type="text/css">' +
                    getDocumentStyleAsString() + '<\/style><base href="' + getBaseURL() + '" target="_blank"/><\/head><body><\/body><\/html>');
            frame.contentDocument.close();

            frame.onload = setPrint;

            // a reload is only needed for IE
            if (frame.contentWindow && frame.contentWindow.location) {
                // ensure that loading of CSS styles in header has finished
                frame.contentWindow.setTimeout(function() {
                    frame.contentWindow.location.reload();
                }, 200);
            }
        },

        onFileSizeExceed : function(oEvent) {
            sap.m.MessageBox.alert(this.getCommonText("Commons_FileSizeExceed"), {
                title : this.getCommonText("Error_TIT")
            });
    
        },

        createAndFillNamespacesModel : function() {
            var oNamespacesModel = new sap.ui.model.json.JSONModel();
            this.getView().setModel(oNamespacesModel, "NamespacesModel");
    
            $.ajax({
                url : this.NAMESPACES_SERVICE + "?$orderby=NameSpace",
                async : false,
                type : "GET",
                dataType : "json",
                success : function(oData) {
                    oNamespacesModel.setData(oData.d.results);
                }
            });
        }

    });

});
