jQuery.sap.declare("sap.secmon.ui.m.commons.controls.RadioButtonGrid");
/**
 * This grid contains radio buttons. It acts like a radiobutton group with
 * property "selectedKey". It is expected that the contained radio buttons - are
 * of type "sap.secmon.ui.m.commons.RadioButton" which has property "key". - or
 * have custom data set with key-value pair ("Key", "<value>"). Usually, the
 * key property would be bound against the "Key" property of an enumeration.
 */
sap.ui.layout.Grid.extend("sap.secmon.ui.m.commons.controls.RadioButtonGrid", {

    metadata : {

        properties : {
            /**
             * Selected key as given in enumeration. E.g. for enumeration
             * "/sap.secmon.services.ui.m.invest/Investigation/Attack/enumValues"
             * a possible key would be "YES" or "NO".
             */
            "selectedKey" : {
                type : "string"
            }
        },
        aggregations : {
            "buttons" : {
                type : "sap.m.RadioButton",
                multiple : true,
                singularName : "button"
            }
        }
    },

    init : function() {
        if (sap.ui.layout.Grid.prototype.init) {
            sap.ui.layout.Grid.prototype.init.apply(this, arguments);
        }
    },

    renderer : {
    // use parent renderer
    },

    addButton : function(oButton) {
        this.addContent(oButton);
        oButton.attachSelect(this._onButtonSelect, this);
        var key = this._getKeyOfButton(oButton);
        if (key === this.getProperty("selectedKey")) {
            oButton.setSelected(true);
        }
        return this;
    },

    insertButton : function(oButton, index) {
        this.insertContent(oButton, index);
        oButton.attachSelect(this._onButtonSelect, this);
        var key = this._getKeyOfButton(oButton);
        if (key === this.getProperty("selectedKey")) {
            oButton.setSelected(true);
        }
        return this;
    },

    removeButton : function(vButton) {
        this.removeContent(vButton);
        var oButton;
        if (vButton.detachSelect) {
            oButton = vButton;
        } else if (typeof vButton === 'number') {
            oButton = this.getButtons()[vButton];
        } else if (typeof vButton === 'string') {
            for (var index = 0; index < this.getButtons().length; index++) {
                if (this.getButtons()[index].getId() === vButton) {
                    oButton = this.getButtons()[index];
                }
            }
        }
        oButton.detachSelect(this._onButtonSelect, this);
        return this;
    },

    removeAllButtons : function() {
        this.removeAllContent();
        var aButtons = this.getContent();
        for (var index = 0; index < aButtons.length; index++) {
            aButtons[index].detachSelect(this._onButtonSelect, this);
        }
        return this;
    },

    getButtons : function() {
        return this.getContent();
    },

    indexOfButton : function(oButton) {
        return this.indexOfContent(oButton);
    },

    /**
     * return key of selected radio button.
     */
    getSelectedKey : function() {
        var selKey = this.getProperty("selectedKey");
        if (selKey) {
            return selKey;
        }
        return null;
    },

    /**
     * set selected radio button by key
     */
    setSelectedKey : function(sKey) {
        if (this.getProperty("selectedKey") === sKey) {
            return this;
        }
        this.setProperty("selectedKey", sKey);
        this._setSelectedButtonByKey(sKey);

        return this;
    },

    /**
     * set a single radio button enabled/disabled.
     */
    setEnabledByKey : function(sKey, bEnabled) {
        var oButton = this._getButtonWithKey(sKey);
        if (oButton) {
            oButton.setEnabled(bEnabled);
        }
        return this;
    },

    _setSelectedButtonByKey : function(sKey) {
        var aButtons = this.getContent();
        for (var i = 0; i < aButtons.length; i++) {
            var oButton = aButtons[i];
            var sButtonKey = this._getKeyOfButton(oButton);
            if (sButtonKey && sButtonKey === sKey) {
                oButton.setSelected(true);
            } else {
                oButton.setSelected(false);
            }
        }
    },

    /**
     * return radio button with matching key. If none is found, return null
     */
    _getButtonWithKey : function(sKey) {
        var aButtons = this.getContent();
        for (var i = 0; i < aButtons.length; i++) {
            var oButton = aButtons[i];
            var sButtonKey = this._getKeyOfButton(oButton);
            if (sButtonKey && sButtonKey === sKey) {
                return oButton;
            }
        }
        return null;
    },

    /**
     * get key of a radio button.
     */
    _getKeyOfButton : function(oButton) {
        if (!oButton) {
            return null;
        }
        // is an instance of sap.secmon.ui.commons.RadioButton
        if (oButton.getKey) {
            return oButton.getKey();
        }
        var customData = oButton.getCustomData();
        if (customData && customData.length > 0) {
            for (var i = 0; i < customData.length; i++) {
                if (customData[i].getKey() === 'Key') {
                    return customData[i].getValue();
                }
            }
        }
        return null;
    },

    _onButtonSelect : function(oEvent) {
        if (oEvent.getParameter("selected") === true) {
            var button = oEvent.getSource();
            var key = this._getKeyOfButton(button);
            this.setProperty("selectedKey", key);
        }
    }

});