$.sap.declare("sap.secmon.ui.browse.DataExplorer");

/**
 * 
 * @memberOf sap.secmon.ui.browse.DataExplorer
 */
sap.ui.core.Control.extend("sap.secmon.ui.browse.DataExplorer", {
    metadata : {
        aggregations : {
            "formTitel" : {
                type : "sap.ui.layout.HorizontalLayout",
                multiple : false
            },
            "formInfo" : {
                type : "sap.ui.layout.form.Form",
                multiple : false
            },
            "formDetail" : {
                type : "sap.ui.layout.form.Form",
                multiple : false
            },
            "formAttri" : {
                type : "sap.ui.layout.form.Form",
                multiple : false
            },
        }
    },

    /**
     * 
     * @memberOf sap.secmon.ui.browse.DataExplorer
     */
    renderer : function(rm, ctrl) {
        rm.write("<div");
        rm.writeControlData(ctrl);
        rm.writeAttribute("class", "sapEtdCustomItemLayout");
        rm.write("><div");
        rm.writeAttribute("class", "sapEtdCustomItemLayoutInner");
        rm.write("></div><div");
        rm.writeAttribute("class", "sapEtdCustomItemLayoutTitle");
        rm.write(">");
        rm.renderControl(ctrl.getFormTitel());
        rm.write("</div><div");
        rm.writeAttribute("class", "sapEtdCustomItemLayoutCntntLeft");
        rm.write(">");
        rm.renderControl(ctrl.getFormInfo());
        rm.write("</div><div");
        rm.writeAttribute("class", "sapEtdCustomItemLayoutCntntMiddle");
        rm.write(">");
        rm.renderControl(ctrl.getFormDetail());
        rm.write("</div><div");
        rm.writeAttribute("class", "sapEtdCustomItemLayoutCntntRight");
        rm.write(">");
        rm.renderControl(ctrl.getFormAttri());
        rm.write("</div></div>");
    },

    onBeforeRendering : function() {
        if (this.resizeTimer) {
            clearTimeout(this.resizeTimer);
            this.resizeTimer = null;
        }
    },

    onAfterRendering : function() {
        var $This = this.$();
        if ($This.parent().parent().hasClass("sapUiUx3DSSVSingleRow")) {
            this._resize();
        } else {
            $This.addClass("CustomItemLayoutSmall");
        }
    },

    _resize : function() {
        if (!this.getDomRef()) {
            return;
        }
        var $This = this.$();
        if ($This.outerWidth() >= 440) {
            $This.removeClass("CustomItemLayoutSmall").addClass("CustomItemLayoutLarge");
        } else {
            $This.removeClass("CustomItemLayoutLarge").addClass("CustomItemLayoutSmall");
        }
        setTimeout(jQuery.proxy(this._resize, this), 300);
    }
});
