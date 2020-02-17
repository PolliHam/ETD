jQuery.sap.declare("sap.secmon.ui.commons.controls.LongTapLink");

/**
 * Constructor for a new LongTapLink.
 * 
 * The LongTapLink extends the standard link with an event handler for long tap
 * events. A popup menu allows to open the link in a new browser tab. The long
 * tap is used on mobile devices instead of a right click.
 * 
 * @class
 */
sap.m.Link.extend("sap.secmon.ui.commons.controls.LongTapLink", {

    init : function() {
        if (!sap.secmon.ui.commons.controls.LongTapLink.prototype.i18nModel) {
            sap.secmon.ui.commons.controls.LongTapLink.prototype.i18nModel = new sap.ui.model.resource.ResourceModel({
                bundleUrl : "/sap/secmon/ui/commons/controls/i18n/UIText.hdbtextbundle"
            });
        }

        // On a mobile device, the right click is simulated with a long tap.
        if (sap.ui.Device.support.touch === true) {
            this.attachBrowserEvent("taphold", function(evt) {
                if (this.getHref()) {
                    this.openMenu();
                    this.disableClick = true;
                }
            });
        }

        // on a long press event, the short click event must be disabled
        this.disableClick = false;
    },

    /**
     * event handler for browser event "click".
     */
    onclick : function(evt) {
        // disable the click event if a long press event (taphold event) took
        // place
        if (this.disableClick === true) {
            evt.stopPropagation();
            this.disableClick = false;
        } else {
            this.firePress();
        }
    },

    /**
     * event handler for browser event "taphold" (long press). SAPUI5 does not
     * honor it by default, the browser event must have been added in init
     * method.
     */
    ontaphold : function(evt) {
        if (sap.ui.Device.support.touch === true) {
            if (this.getHref()) {
                this.openMenu();
                this.disableClick = true;
            }
        }
    },

    openMenu : function() {
        if (sap.ui.Device.support.touch === false) {
            return;
        }

        if (!this.menu) {
            var control = this;
            var controller = {
                onNavigate : function(event) {
                    // do standard action on left-click or short tap
                    control.firePress();
                    control.menu.close();
                    control.disableClick = false;
                },

                onOpenInNewTab : function(event) {
                    window.open(control.getHref());
                    control.menu.close();
                    control.disableClick = false;
                }
            };
            var newTabLink = new sap.m.Link({
                text : "{i18n>LongTapLink_new}",
                press : [ controller.onOpenInNewTab, controller ]
            });
            var navigateLink = new sap.m.Link({
                text : "{i18n>LongTapLink_nav}",
                press : [ controller.onNavigate, controller ]
            });
            this.menu = new sap.m.Popover({
                placement : "Auto",
                title : "{i18n>LongTapLink_Title}",
                content : [ new sap.ui.layout.form.SimpleForm({
                    content : [ navigateLink, newTabLink ]
                }) ]
            });

            this.menu.setModel(sap.secmon.ui.commons.controls.LongTapLink.prototype.i18nModel, "i18n");
            jQuery.sap.syncStyleClass("sapUiSizeCompact", this, this.menu);
        }
        this.menu.openBy(this);
    },

    renderer : {}
});
