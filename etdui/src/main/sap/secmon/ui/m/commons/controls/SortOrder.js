jQuery.sap.declare("sap.secmon.ui.m.commons.controls.SortOrder");

/**
 * this object is the pendant of the SortOrder from from sap.ui.table.Table. it has been created to avoid loading
 * the desktop-table to have access to the enum.
 * @type {{Ascending: string, Descending: string}}
 */

sap.secmon.ui.m.commons.controls.SortOrder = {
    /**
     * Sort Order: ascending.
     * @public
     */
    Ascending : "Ascending",

    /**
     * Sort Order: descending.
     * @public
     */
    Descending : "Descending"
};