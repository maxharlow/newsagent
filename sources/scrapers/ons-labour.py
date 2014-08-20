import requests
import tempfile
import xlrd
from datetime import datetime
import json

store = 'localhost'

print('Retrieving labour market statistics...')
with tempfile.NamedTemporaryFile() as temp:
    request = requests.get('http://www.ons.gov.uk/ons/rel/subnational-labour/regional-labour-market-statistics/august-2014/rft-lm-hi00-august-2014.xls')
    temp.write(request.content)
    temp.flush()
    workbook = xlrd.open_workbook(temp.name)
    sheets = {
        'England': workbook.sheet_by_name('England'),
        'Wales': workbook.sheet_by_name('Wales'),
        'Scotland': workbook.sheet_by_name('Scotland'),
        'NorthernIreland': workbook.sheet_by_name('NI')
    }
    for country in sheets:
        sheet = sheets[country]
        if country == 'England' or country == 'NorthernIreland':
            row_start = 7
            col_start = 1
        else:
            row_start = 6
            col_start = 2
        row = row_start
        while sheet.cell_type(row, col_start + 1) is 2:
            quarter = sheet.cell_value(row, col_start)
            timestamp = datetime.strptime(quarter[4:], '%b %Y').isoformat() # todo: what is the interval here?? overlapping quarters?
            data = {
                '@timestamp': timestamp,
                'country': country,
                'all16AndOver': sheet.cell_value(row, col_start + 1),
                'totalEconomicallyActive': sheet.cell_value(row, col_start + 3),
                'totalInEmployment': sheet.cell_value(row, col_start + 5),
                'unemployed': sheet.cell_value(row, col_start + 7),
                'economicallyInactive': sheet.cell_value(row, col_start + 9),
                'economicActivityRate': sheet.cell_value(row, col_start + 11),
                'employmentRate': sheet.cell_value(row, col_start + 13),
                'unemploymentRate': sheet.cell_value(row, col_start + 15),
                'economicInactivityRate': sheet.cell_value(row, col_start + 17),
            }
            response = requests.post('http://%s:9200/data/labour/' % store, json.dumps(data)) # todo: needs to overwrite duplicate data (for updates) -- send id?
            response.raise_for_status()
            row += 1
