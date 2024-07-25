# -*- coding: utf-8 -*-
{
    'name': "Delivery Person Select",
    'summary': """Delivery Person Select""",
    'description': """Delivery Person Select""",
    'author': "Tecspek",
    'website': "",
    'category': 'Point Of Sale',
    'version': '0.1',

    'depends': [
                'pos_retail',
                ],

    'data': [
        'views/pos_branch_views.xml',
        'views/pos_order.xml',
        'wizards/assign_team_wizard_views.xml',
    ],
}