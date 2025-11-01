import PropTypes from 'prop-types';

function StatCard({ title, value, color }) {
  const displayValue = typeof value === 'number' || typeof value === 'string' ? value : '--';

  return (
    <article className={`rounded-3xl ${color} p-6 shadow-md ring-1 ring-bia-100`}>
      <p className="text-xs font-semibold uppercase tracking-wide text-bia-700">{title}</p>
      <p className="mt-3 text-3xl font-bold text-bia-800 sm:text-4xl">{displayValue}</p>
    </article>
  );
}

StatCard.propTypes = {
  title: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  color: PropTypes.string,
};

StatCard.defaultProps = {
  color: 'bg-white',
};

export default StatCard;
