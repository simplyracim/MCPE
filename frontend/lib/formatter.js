import 'intl';
import 'intl/locale-data/jsonp/en';

const formatter = new Intl.NumberFormat('fr-DZ', {
	style: 'currency',
	currency: 'DZD',
});

export const formatNumber = (number) => {
	if (isNaN(number)) return formatter.format(0)
	return formatter.format(number)
}