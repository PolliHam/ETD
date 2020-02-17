/**
 * extends the MessagePopover with a close button for each message. Caution: This is likely to break in future releases. We code against the internal implementation.
 */
sap.m.MessagePopover.extend("sap.secmon.ui.m.commons.controls.MessagePopover", {

    metadata : {

        properties : {
            _buttonIcon : {
                type : "sap.ui.core.URI",
                defaultValue : "sap-icon://delete",
                visibility : "hidden"
            }
        },
        aggregations : {
            _button : {
                type : "sap.m.Button",
                multiple : false
            }
        }
    },

    init : function() {
        if (sap.m.MessagePopover.prototype.init) {
            sap.m.MessagePopover.prototype.init.apply(this, arguments);
        }

        var that = this;
        this.setAggregation("_button", new sap.m.Button({
            icon : this.getProperty("_buttonIcon"),
            press : function(oEvent) {
                var type = that._selectedMessagePopoverItem.getType();
                var description = that._selectedMessagePopoverItem.getDescription();
                var title = that._selectedMessagePopoverItem.getTitle();

                var messages = sap.ui.getCore().getMessageManager().getMessageModel().getData().filter(function(message) {
                    // The message can be string or string array
                    var bDescrMatch = Array.isArray(message.description) ? message.description.some(function(descrElement) {
                        return descrElement === description;
                    }) : message.description === description;
                    return bDescrMatch && message.type === type && message.message === title;
                });
                sap.ui.getCore().getMessageManager().removeMessages(messages);
                that._navContainer.back();
            }
        }));
    },

    /**
     * This is necessary for ETD's sub-object: The sap.m.MessagePopover has an aggregation "items" of type "sap.m.MessagePopoverItem" (a UI element). However, the element is not displayed in UI, it is
     * used as value object (just like sap.ui.core.message.Message). Its fields are taken and displayed in a hard-coded way. In order to add a close button we need to add the aggregation in a
     * hard-coded way as well. Caution: This is likely to break in future releases.
     */
    _fnHandleItemPress : function(oEvent) {
        sap.m.MessagePopover.prototype._fnHandleItemPress.apply(this, arguments);

        var oListItem = oEvent.getParameter("listItem");
        this._selectedMessagePopoverItem = oListItem._oMessagePopoverItem;

        if (this._detailsPage && !this._detailsPage.getFooter()) {
            this._detailsPage.setFooter(new sap.m.Toolbar({
                content : [ new sap.m.ToolbarSpacer(), this.getAggregation("_button") ]
            }));
        }
    }
});