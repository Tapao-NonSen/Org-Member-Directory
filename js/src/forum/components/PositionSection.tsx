import Component from 'flarum/common/Component';
import MemberCard from './MemberCard';

export interface PositionSectionAttrs {
  position: any;
}

export default class PositionSection extends Component<PositionSectionAttrs> {
  view() {
    const { position } = this.attrs;

    if (!position.members || position.members.length === 0) {
      return null;
    }

    return (
      <div className="PositionSection">
        <h3 className="PositionSection-title">
          {position.name}
        </h3>
        <div className="MemberGrid">
          {position.members.map((member: any) => (
            <MemberCard member={member} />
          ))}
        </div>
      </div>
    );
  }
}
